"use client";

import { Lock, Plus, Trash2, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { getSuppliers } from "@/server/settings";

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ListItem {
  id: string;
  name: string;
}

export function OrderFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: OrderFormDialogProps) {
  const [clientsList, setClientsList] = useState<ListItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<ListItem[]>([]);
  const [clientId, setClientId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<
    (OrderItemData & { _id: string; locked: boolean })[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Модалки для создания нового клиента/поставщика
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [c, s] = await Promise.all([getClients(), getSuppliers()]);
    setClientsList(c);
    setSuppliersList(s);
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  function handleClientCreated(newClient?: { id: string; name: string }) {
    if (newClient) {
      setClientsList((prev) => [...prev, newClient]);
      setClientId(newClient.id);
    }
  }

  function handleSupplierCreated(newSupplier?: { id: string; name: string }) {
    if (newSupplier) {
      setSuppliersList((prev) => [...prev, newSupplier]);
      setSupplierId(newSupplier.id);
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        _id: crypto.randomUUID(),
        name: "",
        quantity: 1,
        purchasePrice: 0,
        clientPrice: 0,
        locked: true,
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

  function toggleLock(index: number) {
    const newItems = [...items];
    const item = newItems[index];
    if (!item.locked) {
      newItems[index] = {
        ...item,
        clientPrice: item.purchasePrice,
        locked: true,
      };
    } else {
      newItems[index] = { ...item, locked: false };
    }
    setItems(newItems);
  }

  function handlePurchasePriceChange(index: number, value: string) {
    const price = value === "" ? 0 : parseFloat(value);
    const newItems = [...items];
    const item = newItems[index];
    newItems[index] = {
      ...item,
      purchasePrice: price,
      clientPrice: item.locked ? price : item.clientPrice,
    };
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !supplierId || items.length === 0) return;

    const client = clientsList.find((c) => c.id === clientId);
    const supplier = suppliersList.find((s) => s.id === supplierId);
    if (!client || !supplier) return;

    setIsLoading(true);
    try {
      await createOrder({
        clientName: client.name,
        supplierName: supplier.name,
        items: items.map(({ _id, locked, ...rest }) => rest),
      });
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Новый заказ</DialogTitle>
            </DialogHeader>

            <FieldGroup>
              {/* Клиент */}
              <Field>
                <Label>Клиент</Label>
                <div className="flex gap-2">
                  <Select
                    value={clientId}
                    onValueChange={(v) => v && setClientId(v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите клиента" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setClientFormOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </Field>

              {/* Поставщик */}
              <Field>
                <Label>Поставщик</Label>
                <div className="flex gap-2">
                  <Select
                    value={supplierId}
                    onValueChange={(v) => v && setSupplierId(v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите поставщика" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliersList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setSupplierFormOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
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

                    <Field>
                      <Label className="text-xs">Название</Label>
                      <Input
                        placeholder="Блузка"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(index, { name: e.target.value })
                        }
                      />
                    </Field>

                    <Field>
                      <Label className="text-xs">Количество</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateItem(index, {
                            quantity: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </Field>

                    {/* Цены с замком */}
                    <div className="flex items-end gap-2">
                      <Field className="flex-1">
                        <Label className="text-xs">Закупка</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.purchasePrice || ""}
                          placeholder="0"
                          onChange={(e) =>
                            handlePurchasePriceChange(index, e.target.value)
                          }
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 mb-0.5"
                        onClick={() => toggleLock(index)}
                      >
                        {item.locked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </Button>
                      <Field className="flex-1">
                        <Label className="text-xs">Клиенту</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.clientPrice || ""}
                          placeholder="0"
                          disabled={item.locked}
                          onChange={(e) =>
                            updateItem(index, {
                              clientPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </Field>
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

            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  isLoading || !clientId || !supplierId || items.length === 0
                }
              >
                {isLoading ? "Создание..." : "Создать заказ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Модалка создания клиента */}
      <ClientFormDialog
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        onSuccess={handleClientCreated}
      />

      {/* Модалка создания поставщика */}
      <SupplierFormDialog
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        onSuccess={handleSupplierCreated}
      />
    </>
  );
}
