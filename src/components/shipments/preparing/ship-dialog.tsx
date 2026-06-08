"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getCommissionRate } from "@/server/settings";
import { shipShipment } from "@/server/shipments";
import type { Shipment } from "@/stores/shipments-store";
import { type ShippedShipmentValues, shippedShipmentSchema } from "../schemas";

interface ShipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
  onSuccess: () => void;
}

export function ShipDialog({
  open,
  onOpenChange,
  shipment,
  onSuccess,
}: ShipDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Сумма товаров в отправке
  const itemsTotal = shipment.items.reduce(
    (sum, item) => sum + parseFloat(item.purchasePrice || "0") * item.quantity,
    0,
  );

  const form = useForm<ShippedShipmentValues>({
    resolver: zodResolver(shippedShipmentSchema),
    mode: "onChange",
    defaultValues: {
      code: shipment.code || "",
      shippingCost: 0,
      commissionRate: 5,
      commissionAmount: 0,
      notes: shipment.notes || "",
    },
  });

  const commissionRate = form.watch("commissionRate");
  const commissionAmount = form.watch("commissionAmount");

  // Загружаем ставку из профиля при открытии
  useEffect(() => {
    if (open) {
      getCommissionRate().then((rate) => {
        const amount = Math.round(itemsTotal * (rate / 100));
        form.reset({
          code: shipment.code || "",
          shippingCost: 0,
          commissionRate: rate,
          commissionAmount: amount,
          notes: shipment.notes || "",
        });
      });
    }
  }, [open, shipment, form, itemsTotal]);

  // Связка: процент → сумма
  const handleRateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rate = parseFloat(e.target.value) || 0;
      form.setValue("commissionRate", rate, { shouldValidate: true });
      form.setValue("commissionAmount", Math.round(itemsTotal * (rate / 100)), {
        shouldValidate: true,
      });
    },
    [form, itemsTotal],
  );

  // Связка: сумма → процент (только если редактировали сумму)
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const amount = parseFloat(e.target.value) || 0;
      form.setValue("commissionAmount", amount, { shouldValidate: true });
      if (itemsTotal > 0) {
        const rate = (amount / itemsTotal) * 100;
        form.setValue("commissionRate", Math.round(rate * 100) / 100, {
          shouldValidate: true,
        });
      }
    },
    [form, itemsTotal],
  );

  async function handleSubmit(values: ShippedShipmentValues) {
    setIsSaving(true);
    try {
      await shipShipment(shipment.id, {
        code: values.code || undefined,
        notes: values.notes || undefined,
        shippingCost: values.shippingCost,
        commissionAmount: values.commissionAmount,
      });
      onOpenChange(false);
      onSuccess();
    } finally {
      setIsSaving(false);
    }
  }

  const shippingCost = form.watch("shippingCost") || 0;
  const totalDeduction = shippingCost + (commissionAmount || 0);

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
            </Field>

            <Field>
              <FieldLabel>Стоимость доставки</FieldLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="KGS"
                {...form.register("shippingCost", { valueAsNumber: true })}
              />
              <FieldError>
                {form.formState.errors.shippingCost?.message}
              </FieldError>
            </Field>

            {/* Комиссия */}
            <div className="space-y-2">
              <FieldLabel>
                Комиссия{" "}
                <span className="text-muted-foreground font-normal">
                  ({itemsTotal.toLocaleString("ru-RU")}с × %)
                </span>
              </FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="%"
                      value={commissionRate || ""}
                      onChange={handleRateChange}
                    />
                    <span className="text-sm text-muted-foreground shrink-0">
                      %
                    </span>
                  </div>
                </Field>
                <Field>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="KGS"
                    value={commissionAmount || ""}
                    onChange={handleAmountChange}
                  />
                  <FieldError>
                    {form.formState.errors.commissionAmount?.message}
                  </FieldError>
                </Field>
              </div>
            </div>

            <Field>
              <FieldLabel>Комментарий</FieldLabel>
              <Input placeholder="Комментарий" {...form.register("notes")} />
            </Field>
          </FieldGroup>

          {/* Итого */}
          {totalDeduction > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Доставка:</span>
                  <span>{shippingCost.toLocaleString("ru-RU")}с</span>
                </div>
              )}
              {(commissionAmount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Комиссия:</span>
                  <span>
                    {(commissionAmount || 0).toLocaleString("ru-RU")}с
                  </span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>Списание:</span>
                <span>{totalDeduction.toLocaleString("ru-RU")}с</span>
              </div>
            </div>
          )}

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
