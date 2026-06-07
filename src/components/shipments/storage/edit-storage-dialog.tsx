"use client";

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
import { getNameSuggestions, getSizeSuggestions } from "@/lib/item-suggestions";
import { updateStorageItem } from "@/server/shipments";
import { useClientsStore } from "@/stores/clients-store";
import type { StorageItem } from "@/stores/storage-store";

interface EditStorageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StorageItem;
  onSuccess: () => void;
}

interface ClientOption {
  label: string;
  value: string;
}

export function EditStorageDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: EditStorageDialogProps) {
  const clientsList = useClientsStore((s) => s.items);
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const isLoadingClients = useClientsStore((s) => s.isLoading);
  const [clientId, setClientId] = useState<string>(item.clientId);
  const [name, setName] = useState(item.name);
  const [size, setSize] = useState(item.size || "");
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      setClientId(item.clientId);
      setName(item.name);
      setSize(item.size || "");
      setQuantity(item.quantity.toString());
      setPurchasePrice(item.purchasePrice);
    }
  }, [open, item, fetchClients]);

  const clientOptions: ClientOption[] = clientsList
    .filter((c) => !c.isBlocked)
    .map((c) => ({ label: c.name, value: c.id }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await updateStorageItem(item.id, {
        clientId,
        name: name.trim(),
        size: size.trim() || undefined,
        quantity: parseInt(quantity, 10) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
      });
      onOpenChange(false);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Редактировать товар</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>Клиент</FieldLabel>
              <Select
                items={clientOptions}
                value={clientId}
                onValueChange={(v) => v && setClientId(v)}
                disabled={isLoadingClients}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {clientOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Название</FieldLabel>
              <AutocompleteInput
                value={name}
                onChange={setName}
                suggestions={getNameSuggestions(name)}
                placeholder="Юбка, Клеш брюки..."
              />
            </Field>
            <Field>
              <FieldLabel>Размер</FieldLabel>
              <AutocompleteInput
                value={size}
                onChange={setSize}
                suggestions={getSizeSuggestions(size)}
                placeholder="32-34, M..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel>Количество</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Цена за штуку</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !clientId}
            >
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
