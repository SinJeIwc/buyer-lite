"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getClients } from "@/server/clients";
import { createOrder, type OrderItemData } from "@/server/orders";
import { getItemTypes, getSuppliers } from "@/server/settings";

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Client {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ItemType {
  id: string;
  name: string;
}

export function OrderFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: OrderFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [clientId, setClientId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<(OrderItemData & { _id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [c, s, it] = await Promise.all([
      getClients(),
      getSuppliers(),
      getItemTypes(),
    ]);
    setClients(c);
    setSuppliers(s);
    setItemTypes(it);
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  function addItem() {
    setItems([
      ...items,
      {
        _id: crypto.randomUUID(),
        itemTypeId: itemTypes[0]?.id || "",
        quantity: 1,
        purchasePrice: 0,
        clientPrice: 0,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, data: Partial<OrderItemData>) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...data };
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !supplierId || items.length === 0) return;

    setIsLoading(true);
    try {
      const itemsData = items.map(({ _id, ...rest }) => rest);
      await createOrder({ clientId, supplierId, items: itemsData });
      onOpenChange(false);
      setClientId("");
      setSupplierId("");
      setItems([]);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Новый заказ</DialogTitle>
          </DialogHeader>

          <FieldGroup className="mt-4">
            {/* Клиент */}
            <Field>
              <Label>Клиент</Label>
              <Select
                value={clientId}
                onValueChange={(v) => v && setClientId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Поставщик */}
            <Field>
              <Label>Поставщик (точка)</Label>
              <Select
                value={supplierId}
                onValueChange={(v) => v && setSupplierId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите поставщика" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Товары */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Товары</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить
                </Button>
              </div>

              {items.map((item, index) => (
                <div
                  key={item._id}
                  className="p-3 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Товар #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <Select
                    value={item.itemTypeId}
                    onValueChange={(v) =>
                      v && updateItem(index, { itemTypeId: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Тип товара" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Кол-во</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, {
                            quantity: parseInt(e.target.value, 10) || 1,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Закупка</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.purchasePrice}
                        onChange={(e) =>
                          updateItem(index, {
                            purchasePrice: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Клиенту</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.clientPrice}
                        onChange={(e) =>
                          updateItem(index, {
                            clientPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Нажмите "Добавить" чтобы добавить товар
                </p>
              )}
            </div>
          </FieldGroup>

          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={
                isLoading || !clientId || !supplierId || items.length === 0
              }
            >
              {isLoading ? "Создание..." : "Создать заказ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
