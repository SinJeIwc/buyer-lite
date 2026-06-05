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
import { updateSupplierItem } from "@/server/supplier-items";
import { useClientsStore } from "@/stores/clients-store";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    clientId: string;
    clientName: string | null;
    name: string;
    quantity: number;
    purchasePrice: string;
  };
  onSuccess: () => void;
}

interface ClientItem {
  label: string;
  value: string;
}

export function EditItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: EditItemDialogProps) {
  const clientsList = useClientsStore((s) => s.clients);
  const fetchClients = useClientsStore((s) => s.fetchClients);
  const isLoadingClients = useClientsStore((s) => s.isLoading);
  const [clientId, setClientId] = useState<string | null>(item.clientId);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      setClientId(item.clientId);
      setName(item.name);
      setQuantity(item.quantity.toString());
      setPurchasePrice(item.purchasePrice);
    }
  }, [open, item, fetchClients]);

  const clientItems: ClientItem[] = clientsList.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientId) return;

    setIsLoading(true);
    try {
      await updateSupplierItem(item.id, {
        clientId,
        name: name.trim(),
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
                items={clientItems}
                value={clientId}
                onValueChange={(v) => v && setClientId(v)}
                disabled={isLoadingClients}
              >
                <SelectTrigger className="w-full">
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
            <Field>
              <FieldLabel htmlFor="edit-name">Название</FieldLabel>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-quantity">Количество</FieldLabel>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-price">Цена за штуку</FieldLabel>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </Field>
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
