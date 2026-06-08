"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { updateStorageItem } from "@/server/storage";
import { useClientsStore } from "@/stores/clients-store";
import type { StorageItem } from "@/stores/storage-store";
import { type EditStorageItemValues, editStorageItemSchema } from "../schemas";

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
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditStorageItemValues>({
    resolver: zodResolver(editStorageItemSchema),
    mode: "onChange",
    defaultValues: {
      clientId: item.clientId,
      name: item.name,
      size: item.size || "",
      quantity: item.quantity,
      purchasePrice: parseFloat(item.purchasePrice),
    },
  });

  useEffect(() => {
    if (open) {
      fetchClients();
      form.reset({
        clientId: item.clientId,
        name: item.name,
        size: item.size || "",
        quantity: item.quantity,
        purchasePrice: parseFloat(item.purchasePrice),
      });
    }
  }, [open, item, fetchClients, form]);

  const clientOptions: ClientOption[] = clientsList
    .filter((c) => !c.isBlocked)
    .map((c) => ({ label: c.name, value: c.id }));

  async function handleSubmit(values: EditStorageItemValues) {
    setIsSaving(true);
    try {
      await updateStorageItem(item.id, {
        clientId: values.clientId,
        name: values.name.trim(),
        size: values.size?.trim() || undefined,
        quantity: values.quantity,
        purchasePrice: values.purchasePrice,
      });
      onOpenChange(false);
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Редактировать товар</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>Клиент</FieldLabel>
              <Select
                items={clientOptions}
                value={form.watch("clientId")}
                onValueChange={(v) => v && form.setValue("clientId", v)}
                disabled={isLoadingClients}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isLoadingClients ? "Загрузка..." : "Выберите клиента"
                    }
                  />
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
                value={form.watch("name")}
                onChange={(v) => form.setValue("name", v)}
                suggestions={getNameSuggestions(form.watch("name"))}
                placeholder="Юбка, Клеш брюки..."
              />
              {form.formState.errors.name && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </span>
              )}
            </Field>
            <Field>
              <FieldLabel>Размер</FieldLabel>
              <AutocompleteInput
                value={form.watch("size") || ""}
                onChange={(v) => form.setValue("size", v)}
                suggestions={getSizeSuggestions(
                  form.watch("size") || "",
                  form.watch("name"),
                )}
                placeholder="32-34, M..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel>Количество</FieldLabel>
                <Input type="number" min="1" {...form.register("quantity")} />
                {form.formState.errors.quantity && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.quantity.message}
                  </span>
                )}
              </Field>
              <Field>
                <FieldLabel>Цена за штуку</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("purchasePrice")}
                />
                {form.formState.errors.purchasePrice && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.purchasePrice.message}
                  </span>
                )}
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
