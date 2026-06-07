"use client";

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
import { createShipment } from "@/server/shipments";
import { useClientsStore } from "@/stores/clients-store";

interface CartItem {
  storageItemId: string;
  name: string;
  size: string | null;
  maxQuantity: number;
  quantity: number;
  clientId: string;
}

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

  const [clientId, setClientId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [destinationTouched, setDestinationTouched] = useState(false);

  // Сброс при открытии
  useEffect(() => {
    if (open) {
      fetchClients();
      const defaultClientId =
        cartClientIds.length === 1 ? cartClientIds[0] : null;
      setClientId(defaultClientId);
      setCode("");
      setDestination("");
      setNotes("");
      setDestinationTouched(false);
    }
  }, [open, fetchClients, cartClientIds]);

  // Автозаполнение destination из города клиента
  useEffect(() => {
    if (!clientId || destinationTouched) return;
    const client = clientsList.find((c) => c.id === clientId);
    if (client?.city) {
      setDestination(client.city);
    }
  }, [clientId, clientsList, destinationTouched]);

  const clientOptions = clientsList
    .filter((c) => !c.isBlocked)
    .map((c) => ({ label: c.name, value: c.id }));

  const selectedClient = clientId
    ? clientsList.find((c) => c.id === clientId)
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || cart.length === 0) return;

    setIsLoading(true);
    try {
      await createShipment({
        clientId,
        code: code || undefined,
        destination: destination || undefined,
        notes: notes || undefined,
        items: cart.map((item) => ({
          storageItemId: item.storageItemId,
          quantity: item.quantity,
        })),
      });
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
            <DialogTitle>Оформить отправку</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            {/* Получатель */}
            <Field>
              <FieldLabel>Получатель</FieldLabel>
              <Select
                items={clientOptions}
                value={clientId}
                onValueChange={(val) => {
                  setClientId(val);
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
              {/* Информация о клиенте */}
              {selectedClient &&
                (selectedClient.phone || selectedClient.notes) && (
                  <div className="text-muted-foreground">
                    {selectedClient.phone && (
                      <div className="text-sm">
                        <span className="">Номер: </span>
                        <span className="font-medium">
                          {selectedClient.phone}
                        </span>
                      </div>
                    )}
                    {selectedClient.notes && (
                      <div className="text-sm">
                        <span className="">Заметка: </span>
                        <span>{selectedClient.notes}</span>
                      </div>
                    )}
                  </div>
                )}
            </Field>

            {/* ID отправки */}
            <Field>
              <FieldLabel>ID отправки (необязательно)</FieldLabel>
              <Input
                placeholder="Например: 12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>

            {/* Куда едет */}
            <Field>
              <FieldLabel>Куда едет</FieldLabel>
              <Input
                placeholder="Город, адрес"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setDestinationTouched(true);
                }}
              />
            </Field>

            {/* Комментарий */}
            <Field>
              <FieldLabel>Комментарий</FieldLabel>
              <Input
                placeholder="Комментарий"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            {/* Сводка выбранных товаров */}
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
                isLoading || !destination || !clientId || cart.length === 0
              }
            >
              {isLoading ? "Создание..." : "Создать отправку"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
