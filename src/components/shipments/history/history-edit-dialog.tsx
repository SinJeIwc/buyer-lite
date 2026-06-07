"use client";

import { useState } from "react";
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
import { updateShipment } from "@/server/shipments";
import type { Shipment } from "@/stores/shipments-store";

interface HistoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
  onSuccess: () => void;
}

export function HistoryEditDialog({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: HistoryEditDialogProps) {
  const [code, setCode] = useState(shipment.code || "");
  const [notes, setNotes] = useState(shipment.notes || "");
  const [shippingCost, setShippingCost] = useState(
    shipment.shippingCost ? parseFloat(shipment.shippingCost) : 0,
  );
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateShipment(shipment.id, {
        code: code || undefined,
        notes: notes || undefined,
        shippingCost: shippingCost || undefined,
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
            <DialogTitle>
              Отправка{shipment.code ? ` #${shipment.code}` : ""}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>ID отправки</FieldLabel>
              <Input
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
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
            <Field>
              <FieldLabel>Комментарий</FieldLabel>
              <Input
                placeholder="Комментарий"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
