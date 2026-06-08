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
import { updateShipment } from "@/server/shipments";
import type { Shipment } from "@/stores/shipments-store";
import { type ShippedShipmentValues, shippedShipmentSchema } from "../schemas";

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
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ShippedShipmentValues>({
    resolver: zodResolver(shippedShipmentSchema),
    mode: "onChange",
    defaultValues: {
      code: shipment.code || "",
      shippingCost: shipment.shippingCost
        ? parseFloat(shipment.shippingCost)
        : 0,
      notes: shipment.notes || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        code: shipment.code || "",
        shippingCost: shipment.shippingCost
          ? parseFloat(shipment.shippingCost)
          : 0,
        notes: shipment.notes || "",
      });
    }
  }, [open, shipment, form]);

  async function handleSubmit(values: ShippedShipmentValues) {
    setIsSaving(true);
    try {
      await updateShipment(shipment.id, {
        code: values.code || undefined,
        notes: values.notes || undefined,
        shippingCost: values.shippingCost || undefined,
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
            <DialogTitle>
              Отправка{shipment.code ? ` #${shipment.code}` : ""}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>ID отправки</FieldLabel>
              <Input placeholder="12345" {...form.register("code")} />
            </Field>
            <Field>
              <FieldLabel>Стоимость доставки</FieldLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="KGS"
                {...form.register("shippingCost")}
              />
            </Field>
            <Field>
              <FieldLabel>Комментарий</FieldLabel>
              <Input placeholder="Комментарий" {...form.register("notes")} />
            </Field>
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
