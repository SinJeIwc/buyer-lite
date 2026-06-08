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
import { shipShipment } from "@/server/shipments";
import { type ShippedShipmentValues, shippedShipmentSchema } from "../schemas";

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
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ShippedShipmentValues>({
    resolver: zodResolver(shippedShipmentSchema),
    mode: "onChange",
    defaultValues: {
      code: defaultCode || "",
      shippingCost: undefined,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        code: defaultCode || "",
        shippingCost: undefined,
        notes: "",
      });
    }
  }, [open, defaultCode, form]);

  async function handleSubmit(values: ShippedShipmentValues) {
    setIsSaving(true);
    try {
      await shipShipment(shipmentId, {
        code: values.code || undefined,
        notes: values.notes || undefined,
        shippingCost: values.shippingCost,
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
            <DialogTitle>Отправить</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>ID отправки</FieldLabel>
              <Input placeholder="12345" {...form.register("code")} />
              {form.formState.errors.code && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.code.message}
                </span>
              )}
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
              {form.formState.errors.shippingCost && (
                <span className="text-xs text-destructive">
                  {form.formState.errors.shippingCost.message}
                </span>
              )}
            </Field>
            <Field>
              <FieldLabel>Комментарий</FieldLabel>
              <Input placeholder="Комментарий" {...form.register("notes")} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Отправка..." : "Подтвердить отправку"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
