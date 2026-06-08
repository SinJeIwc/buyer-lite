"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getNameSuggestions,
  getSizeSuggestions,
  saveItemSuggestion,
} from "@/lib/item-suggestions";
import { createSupplierItem } from "@/server/supplier-items";
import { useClientsStore } from "@/stores/clients-store";
import type { ClientOption, OrderItem } from "./types";

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  onSuccess: () => void;
}

export function NewOrderDialog({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  onSuccess,
}: NewOrderDialogProps) {
  const clientsList = useClientsStore((s) => s.items);
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const [clientId, setClientId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([
    {
      _id: Math.random().toString(36).slice(2),
      name: "",
      size: "",
      quantity: 1,
      purchasePrice: 0,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      setClientId(null);
      setItems([
        {
          _id: Math.random().toString(36).slice(2),
          name: "",
          size: "",
          quantity: 0,
          purchasePrice: 0,
        },
      ]);
    }
  }, [open, fetchClients]);

  const clientItems: ClientOption[] = clientsList
    .filter((c) => !c.isBlocked)
    .map((c) => ({
      label: c.name,
      value: c.id,
    }));

  function addItem() {
    setItems([
      ...items,
      {
        _id: Math.random().toString(36).slice(2),
        name: "",
        size: "",
        quantity: 0,
        purchasePrice: 0,
      },
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
    if (!clientId || !supplierId || items.length === 0) return;

    // Валидация: все поля обязательны
    const hasInvalidItems = items.some(
      (item) =>
        !item.name.trim() || item.quantity <= 0 || item.purchasePrice <= 0,
    );
    if (hasInvalidItems) return;

    setIsLoading(true);
    try {
      for (const item of items) {
        if (item.name.trim() && item.quantity > 0) {
          await createSupplierItem({
            clientId,
            supplierId,
            name: item.name.trim(),
            size: item.size.trim() || undefined,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
          });

          // Сохраняем в рекомендации
          saveItemSuggestion(item.name.trim(), item.size.trim() || undefined);
        }
      }
      onOpenChange(false);
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
            <DialogTitle>Заказ ({supplierName})</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            {/* Клиент */}
            <Field>
              <FieldLabel>Клиент</FieldLabel>
              <Select
                items={clientItems}
                value={clientId}
                onValueChange={setClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {clientItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Товары */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>Товары</FieldLabel>
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
                  className="p-2 bg-muted/50 rounded-lg space-y-2"
                >
                  <Field>
                    <FieldLabel className="text-xs flex items-center justify-between">
                      Название
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
                    </FieldLabel>

                    <AutocompleteInput
                      value={item.name}
                      onChange={(value) => updateItem(index, { name: value })}
                      suggestions={getNameSuggestions(item.name)}
                      placeholder="Юбка №032"
                    />
                  </Field>

                  <div className="grid grid-cols-3 gap-2">
                    <Field>
                      <FieldLabel className="text-xs">Размер</FieldLabel>
                      <AutocompleteInput
                        value={item.size}
                        onChange={(value) => updateItem(index, { size: value })}
                        suggestions={getSizeSuggestions(item.size)}
                        placeholder="32-40, M"
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs">Количество</FieldLabel>
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
                      <FieldLabel className="text-xs">Цена/шт</FieldLabel>
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
                !clientId ||
                items.length === 0 ||
                items.some(
                  (item) =>
                    !item.name.trim() ||
                    item.quantity <= 0 ||
                    item.purchasePrice <= 0,
                )
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
