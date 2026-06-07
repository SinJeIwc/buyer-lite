"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
  updateShipment,
  updateShipmentItemQuantity,
} from "@/server/shipments";
import { useClientsStore } from "@/stores/clients-store";
import type { Shipment } from "@/stores/shipments-store";
import { useStorageStore } from "@/stores/storage-store";
import { type PickedItem, StoragePickerDialog } from "./storage-picker-dialog";

interface EditShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
  onSuccess: () => void;
}

interface LocalItem {
  id: string;
  storageItemId: string;
  name: string;
  size: string | null;
  quantity: number;
  originalQuantity: number;
  isNew?: boolean;
}

export function EditShipmentDialog({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: EditShipmentDialogProps) {
  const clientsList = useClientsStore((s) => s.items);
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const isLoadingClients = useClientsStore((s) => s.isLoading);
  const storageItems = useStorageStore((s) => s.items);
  const fetchStorage = useStorageStore((s) => s.fetchItems);
  const isLoadingStorage = useStorageStore((s) => s.isLoading);

  const isPreparing = shipment.status === "preparing";

  const [clientId, setClientId] = useState(shipment.clientId);
  const [code, setCode] = useState(shipment.code || "");
  const [destination, setDestination] = useState(shipment.destination || "");
  const [notes, setNotes] = useState(shipment.notes || "");
  const [shippingCost, setShippingCost] = useState(
    shipment.shippingCost ? parseFloat(shipment.shippingCost) : 0,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Локальное состояние товаров
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchStorage();
      setClientId(shipment.clientId);
      setCode(shipment.code || "");
      setDestination(shipment.destination || "");
      setNotes(shipment.notes || "");
      setShippingCost(
        shipment.shippingCost ? parseFloat(shipment.shippingCost) : 0,
      );
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
  }, [open, shipment, fetchClients, fetchStorage]);

  const clientOptions = clientsList
    .filter((c) => !c.isBlocked)
    .map((c) => ({ label: c.name, value: c.id }));

  // ID товаров на складе, которые уже в отправке (для исключения из пикера)
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

  function handleAddItems(picked: PickedItem[]) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Обновляем основные поля
      await updateShipment(shipment.id, {
        clientId,
        code: code || undefined,
        destination: destination || undefined,
        notes: notes || undefined,
        shippingCost: isPreparing ? undefined : shippingCost || undefined,
      });

      if (isPreparing) {
        // Удаляем отмеченные товары
        for (const itemId of removedIds) {
          await removeShipmentItem(itemId);
        }

        // Обновляем количество изменённых товаров
        for (const item of localItems) {
          if (removedIds.has(item.id)) continue;
          if (item.isNew) {
            // Добавляем новый товар
            await addShipmentItem(
              shipment.id,
              item.storageItemId,
              item.quantity,
            );
          } else if (item.quantity !== item.originalQuantity) {
            // Изменяем количество
            await updateShipmentItemQuantity(item.id, item.quantity);
          }
        }
      }

      onOpenChange(false);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>
                Отправка{shipment.code ? ` #${shipment.code}` : ""}
              </DialogTitle>
            </DialogHeader>

            <FieldGroup>
              {isPreparing ? (
                <>
                  <Field>
                    <FieldLabel>Клиент</FieldLabel>
                    <Select
                      items={clientOptions}
                      value={clientId}
                      onValueChange={(v) => v && setClientId(v)}
                      disabled={isLoadingClients}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingClients
                              ? "Загрузка..."
                              : "Выберите клиента"
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
                    <FieldLabel>Куда едет</FieldLabel>
                    <Input
                      placeholder="Город, адрес"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </Field>
                </>
              ) : (
                <Field>
                  <FieldLabel>Стоимость доставки (KGS)</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={shippingCost || ""}
                    onChange={(e) =>
                      setShippingCost(parseFloat(e.target.value) || 0)
                    }
                  />
                </Field>
              )}

              <Field>
                <FieldLabel>ID отправки</FieldLabel>
                <Input
                  placeholder="12345"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Комментарий</FieldLabel>
                <Input
                  placeholder="Комментарий"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>

              {/* Товары — только для preparing */}
              {isPreparing && (
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
              )}
            </FieldGroup>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isPreparing && (
        <StoragePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          items={storageItems}
          isLoading={isLoadingStorage}
          excludeIds={excludeIds}
          onConfirm={handleAddItems}
        />
      )}
    </>
  );
}
