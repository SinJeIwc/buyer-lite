"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  addShipmentItem,
  removeShipmentItem,
  updateShipmentItemQuantity,
} from "@/server/shipment-actions";
import { updateShipment } from "@/server/shipments";
import { useClientsStore } from "@/stores/clients-store";
import type { Shipment } from "@/stores/shipments-store";
import { useStorageStore } from "@/stores/storage-store";
import {
  type PreparingShipmentValues,
  preparingShipmentSchema,
} from "../schemas";
import type { CartItem, LocalItem } from "../types";
import { StoragePickerDialog } from "./storage-picker-dialog";

interface EditPreparingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
  onSuccess: () => void;
}

export function EditPreparingDialog({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: EditPreparingDialogProps) {
  const clientsList = useClientsStore((s) => s.items);
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const isLoadingClients = useClientsStore((s) => s.isLoading);
  const storageItems = useStorageStore((s) => s.items);
  const fetchStorage = useStorageStore((s) => s.fetchItems);
  const isLoadingStorage = useStorageStore((s) => s.isLoading);

  const form = useForm<PreparingShipmentValues>({
    resolver: zodResolver(preparingShipmentSchema),
    mode: "onChange",
    defaultValues: {
      clientId: shipment.clientId,
      destination: shipment.destination || "",
      code: shipment.code || "",
      notes: shipment.notes || "",
    },
  });

  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchStorage();
      form.reset({
        clientId: shipment.clientId,
        destination: shipment.destination || "",
        code: shipment.code || "",
        notes: shipment.notes || "",
      });
      setLocalItems(
        shipment.items.map((i) => ({
          id: i.id,
          storageItemId: i.storageItemId,
          name: i.name || "",
          size: i.size,
          quantity: i.quantity,
          originalQuantity: i.quantity,
        })),
      );
      setRemovedIds(new Set());
    }
  }, [open, shipment, fetchClients, fetchStorage, form]);

  const clientOptions = clientsList
    .filter((c) => !c.isBlocked)
    .map((c) => ({ label: c.name, value: c.id }));

  const excludeIds = new Set(
    localItems.filter((i) => !removedIds.has(i.id)).map((i) => i.storageItemId),
  );

  const activeItems = localItems.filter((i) => !removedIds.has(i.id));

  function handleRemoveItem(itemId: string) {
    setRemovedIds((prev) => new Set(prev).add(itemId));
  }

  function handleQuantityChange(itemId: string, newQuantity: number) {
    setLocalItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, quantity: Math.max(1, newQuantity) } : i,
      ),
    );
  }

  function handleAddItems(picked: CartItem[]) {
    setLocalItems((prev) => [
      ...prev,
      ...picked.map((p) => ({
        id: `new-${p.storageItemId}`,
        storageItemId: p.storageItemId,
        name: p.name,
        size: p.size,
        quantity: p.quantity,
        originalQuantity: 0,
        isNew: true,
      })),
    ]);
  }

  async function handleSubmit(values: PreparingShipmentValues) {
    setIsSaving(true);
    try {
      await updateShipment(shipment.id, {
        clientId: values.clientId,
        code: values.code || undefined,
        destination: values.destination || undefined,
        notes: values.notes || undefined,
      });

      for (const itemId of removedIds) {
        await removeShipmentItem(itemId);
      }

      for (const item of localItems) {
        if (removedIds.has(item.id)) continue;
        if (item.isNew) {
          await addShipmentItem(shipment.id, item.storageItemId, item.quantity);
        } else if (item.quantity !== item.originalQuantity) {
          await updateShipmentItemQuantity(item.id, item.quantity);
        }
      }

      onOpenChange(false);
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>
                Отправка{shipment.code ? ` #${shipment.code}` : ""}
              </DialogTitle>
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
                  <SelectTrigger>
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
                {form.formState.errors.clientId && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.clientId.message}
                  </span>
                )}
              </Field>

              <Field>
                <FieldLabel>Куда едет</FieldLabel>
                <Input
                  placeholder="Город, адрес"
                  required
                  {...form.register("destination")}
                />
                {form.formState.errors.destination && (
                  <span className="text-xs text-destructive">
                    {form.formState.errors.destination.message}
                  </span>
                )}
              </Field>

              <Field>
                <FieldLabel>ID отправки</FieldLabel>
                <Input placeholder="12345" {...form.register("code")} />
              </Field>

              <Field>
                <FieldLabel>Комментарий</FieldLabel>
                <Input placeholder="Комментарий" {...form.register("notes")} />
              </Field>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FieldLabel>Товары ({activeItems.length})</FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus className="size-3.5 mr-1" />
                    Добавить
                  </Button>
                </div>

                {activeItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-sm truncate flex-1 min-w-0">
                      {item.name}
                      {item.size && (
                        <span className="text-muted-foreground ml-1">
                          ({item.size})
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        className="w-14 h-7 text-center text-sm"
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            parseInt(e.target.value, 10) || 1,
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSaving || activeItems.length === 0}
              >
                {isSaving ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StoragePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        items={storageItems}
        isLoading={isLoadingStorage}
        excludeIds={excludeIds}
        onConfirm={handleAddItems}
      />
    </>
  );
}
