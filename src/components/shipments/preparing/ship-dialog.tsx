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
import { shipShipment } from "@/server/shipments";

interface ShipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: string;
  defaultCode?: string | null;
  onSuccess: () => void;
}

export function ShipDialog({
  open,
  onOpenChange,
  shipmentId,
  defaultCode,
  onSuccess,
}: ShipDialogProps) {
  const [code, setCode] = useState(defaultCode || "");
  const [notes, setNotes] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await shipShipment(shipmentId, {
        code: code || undefined,
        notes: notes || undefined,
        shippingCost: parseFloat(shippingCost) || undefined,
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
            <DialogTitle>Отправить</DialogTitle>
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
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
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
              {isLoading ? "Отправка..." : "Подтвердить отправку"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
