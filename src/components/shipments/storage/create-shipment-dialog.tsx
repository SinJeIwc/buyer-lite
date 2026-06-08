"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { createShipment } from "@/server/shipments";
import { useClientsStore } from "@/stores/clients-store";
import {
  type PreparingShipmentValues,
  preparingShipmentSchema,
} from "../schemas";
import type { CartItem } from "../types";

interface CreateShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  cartClientIds: string[];
  onSuccess: () => void;
}

export function CreateShipmentDialog({
  open,
  onOpenChange,
  cart,
  cartClientIds,
  onSuccess,
}: CreateShipmentDialogProps) {
  const clientsList = useClientsStore((s) => s.items);
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const isLoadingClients = useClientsStore((s) => s.isLoading);
  const [isSaving, setIsSaving] = useState(false);
  const [destinationTouched, setDestinationTouched] = useState(false);

  const form = useForm<PreparingShipmentValues>({
    resolver: zodResolver(preparingShipmentSchema),
    mode: "onChange",
    defaultValues: {
      clientId: "",
      destination: "",
      code: "",
      notes: "",
    },
  });

  const clientId = form.watch("clientId");

  useEffect(() => {
    if (open) {
      fetchClients();
      const defaultClientId =
        cartClientIds.length === 1 ? cartClientIds[0] : "";
      form.reset({
        clientId: defaultClientId,
        destination: "",
        code: "",
        notes: "",
      });
      setDestinationTouched(false);
    }
  }, [open, fetchClients, cartClientIds, form]);

  // Автозаполнение destination из города клиента
  useEffect(() => {
    if (!clientId || destinationTouched) return;
    const client = clientsList.find((c) => c.id === clientId);
    if (client?.city) {
      form.setValue("destination", client.city);
    }
  }, [clientId, clientsList, destinationTouched, form]);

  const clientOptions = clientsList
    .filter((c) => !c.isBlocked)
    .map((c) => ({ label: c.name, value: c.id }));

  const selectedClient = clientId
    ? clientsList.find((c) => c.id === clientId)
    : null;

  async function handleSubmit(values: PreparingShipmentValues) {
    if (cart.length === 0) return;
    setIsSaving(true);
    try {
      await createShipment({
        clientId: values.clientId,
        code: values.code || undefined,
        destination: values.destination || undefined,
        notes: values.notes || undefined,
        items: cart.map((item) => ({
          storageItemId: item.storageItemId,
          quantity: item.quantity,
        })),
      });
      onOpenChange(false);
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Оформить отправку</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>Получатель</FieldLabel>
              <Select
                items={clientOptions}
                value={clientId}
                onValueChange={(val) => {
                  form.setValue("clientId", val || "");
                  setDestinationTouched(false);
                }}
                disabled={isLoadingClients}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingClients
                        ? "Загрузка..."
                        : "Кто оплачивает доставку"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {clientOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
              {selectedClient &&
                (selectedClient.phone || selectedClient.notes) && (
                  <div className="text-muted-foreground">
                    {selectedClient.phone && (
                      <div className="text-sm">
                        Номер:{" "}
                        <span className="font-medium">
                          {selectedClient.phone}
                        </span>
                      </div>
                    )}
                    {selectedClient.notes && (
                      <div className="text-sm">{selectedClient.notes}</div>
                    )}
                  </div>
                )}
            </Field>

            <Field>
              <FieldLabel>ID отправки (необязательно)</FieldLabel>
              <Input placeholder="Например: 12345" {...form.register("code")} />
            </Field>

            <Field>
              <FieldLabel>Куда едет</FieldLabel>
              <Input
                placeholder="Город, адрес"
                {...form.register("destination")}
                onChange={(e) => {
                  form.setValue("destination", e.target.value);
                  setDestinationTouched(true);
                }}
              />
              {form.formState.errors.destination && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.destination.message}
                </span>
              )}
            </Field>

            <Field>
              <FieldLabel>Комментарий</FieldLabel>
              <Input placeholder="Комментарий" {...form.register("notes")} />
            </Field>

            {cart.length > 0 && (
              <div className="space-y-1">
                <FieldLabel>Товары ({cart.length})</FieldLabel>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border p-2 bg-muted/30">
                  {cart.map((item) => (
                    <div
                      key={item.storageItemId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate">
                        {item.name}
                        {item.size && (
                          <span className="text-muted-foreground ml-1">
                            ({item.size})
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {item.quantity}шт
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                isSaving || cart.length === 0 || !form.formState.isValid
              }
            >
              {isSaving ? "Создание..." : "Создать отправку"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
