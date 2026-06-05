"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { createSupplierItem } from "@/server/supplier-items";

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  onSuccess: () => void;
}

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  purchasePrice: number;
}

export function NewOrderDialog({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  onSuccess,
}: NewOrderDialogProps) {
  const [items, setItems] = useState<OrderItem[]>([
    { _id: crypto.randomUUID(), name: "", quantity: 1, purchasePrice: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  function addItem() {
    setItems([
      ...items,
      { _id: crypto.randomUUID(), name: "", quantity: 1, purchasePrice: 0 },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, data: Partial<OrderItem>) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...data };
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId || items.length === 0) return;

    setIsLoading(true);
    try {
      for (const item of items) {
        if (item.name.trim() && item.quantity > 0) {
          await createSupplierItem({
            supplierId,
            name: item.name.trim(),
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
          });
        }
      }
      onOpenChange(false);
      setItems([
        { _id: crypto.randomUUID(), name: "", quantity: 1, purchasePrice: 0 },
      ]);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Заказ: {supplierName}</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <div className="space-y-2">
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
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <Field>
                    <Label className="text-xs">Название</Label>
                    <Input
                      placeholder="ADE25 юбка синяя"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(index, { name: e.target.value })
                      }
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-2">
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
                    <Field>
                      <Label className="text-xs">Цена/шт</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.purchasePrice || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateItem(index, {
                            purchasePrice: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                isLoading ||
                items.filter((i) => i.name.trim() && i.quantity > 0).length ===
                  0
              }
            >
              {isLoading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
