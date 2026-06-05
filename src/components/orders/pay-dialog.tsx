"use client";

import { Lock, Plus, Trash2, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { type PayItem, paySupplierItems } from "@/server/supplier-items";
import { useItemsStore } from "@/stores/items-store";

interface PayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  onSuccess: () => void;
}

interface SelectedItem {
  _id: string;
  supplierItemId?: string;
  isNew: boolean;
  name: string;
  maxQuantity: number;
  quantity: number;
  purchasePrice: number;
  selected: boolean;
}

export function PayDialog({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  onSuccess,
}: PayDialogProps) {
  const [clientsList, setClientsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [clientPriceTotal, setClientPriceTotal] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const storeItems = useItemsStore((s) => s.items);
  const refresh = useItemsStore((s) => s.refresh);

  const loadData = useCallback(async () => {
    const c = await getClients();
    setClientsList(c);
    // Фильтруем товары по поставщику из store
    const supplierItems = storeItems.filter(
      (item) => item.supplierId === supplierId,
    );
    setItems(
      supplierItems.map((item) => ({
        _id: crypto.randomUUID(),
        supplierItemId: item.id,
        isNew: false,
        name: item.name,
        maxQuantity: item.quantity,
        quantity: item.quantity,
        purchasePrice: parseFloat(item.purchasePrice),
        selected: true,
      })),
    );
  }, [supplierId, storeItems]);

  useEffect(() => {
    if (open) {
      loadData();
      setClientId("");
      setClientPriceTotal("");
      setIsLocked(true);
    }
  }, [open, loadData]);

  // Автоматический расчёт общей цены
  const totalPurchase = items
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + i.purchasePrice * i.quantity, 0);

  // Обновляем clientPriceTotal при изменении totalPurchase
  useEffect(() => {
    if (isLocked) {
      setClientPriceTotal(totalPurchase.toFixed(0));
    }
  }, [totalPurchase, isLocked]);

  function toggleItem(index: number) {
    const newItems = [...items];
    newItems[index].selected = !newItems[index].selected;
    setItems(newItems);
  }

  function updateQuantity(index: number, quantity: number) {
    const newItems = [...items];
    newItems[index].quantity = Math.min(quantity, newItems[index].maxQuantity);
    setItems(newItems);
  }

  function addNewItem() {
    setItems([
      ...items,
      {
        _id: crypto.randomUUID(),
        isNew: true,
        name: "",
        maxQuantity: 9999,
        quantity: 1,
        purchasePrice: 0,
        selected: true,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateNewItem(index: number, data: Partial<SelectedItem>) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...data };
    setItems(newItems);
  }

  async function handlePay() {
    if (!clientId) return;

    const selectedItems: PayItem[] = items
      .filter((i) => i.selected && i.quantity > 0)
      .map((i) => ({
        supplierItemId: i.supplierItemId,
        isNew: i.isNew,
        name: i.name,
        quantity: i.quantity,
        purchasePrice: i.purchasePrice,
      }));

    if (selectedItems.length === 0) return;

    setIsLoading(true);
    try {
      await paySupplierItems({
        supplierId,
        clientId,
        items: selectedItems,
        clientPriceTotal: parseFloat(clientPriceTotal) || totalPurchase,
      });
      await refresh();
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Оплата: {supplierName}</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          {/* Клиент */}
          <Field>
            <Label>Клиент *</Label>
            <Select value={clientId} onValueChange={(v) => v && setClientId(v)}>
              <SelectTrigger className="w-full">
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
          </Field>

          {/* Товары */}
          <div className="space-y-2">
            <Label>Товары</Label>
            {items.map((item, index) => (
              <div
                key={item._id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
              >
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => toggleItem(index)}
                />
                <div className="flex-1 space-y-1">
                  {item.isNew ? (
                    <Input
                      placeholder="Название товара"
                      value={item.name}
                      onChange={(e) =>
                        updateNewItem(index, { name: e.target.value })
                      }
                      className="h-7 text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Кол-во</Label>
                      <Input
                        type="number"
                        min="1"
                        max={item.maxQuantity}
                        value={item.quantity || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateQuantity(
                            index,
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                        className="h-7 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Цена/шт</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.purchasePrice || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateNewItem(index, {
                            purchasePrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-7 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Сумма</Label>
                      <div className="h-7 flex items-center text-sm">
                        {(item.purchasePrice * item.quantity).toLocaleString(
                          "ru-RU",
                        )}{" "}
                        с
                      </div>
                    </div>
                  </div>
                </div>
                {item.isNew && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addNewItem}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить товар
            </Button>
          </div>

          {/* Итого */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Итого:</span>
              <span className="font-medium">
                {totalPurchase.toLocaleString("ru-RU")} с
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Для клиента:</Label>
              <div className="flex-1 flex items-center gap-1">
                <Input
                  type="number"
                  value={clientPriceTotal}
                  onChange={(e) => setClientPriceTotal(e.target.value)}
                  disabled={isLocked}
                  className="h-8"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsLocked(!isLocked)}
                >
                  {isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </FieldGroup>

        <DialogFooter>
          <Button
            onClick={handlePay}
            disabled={
              isLoading ||
              !clientId ||
              items.filter((i) => i.selected).length === 0
            }
          >
            {isLoading ? "Оплата..." : "Оплатить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
