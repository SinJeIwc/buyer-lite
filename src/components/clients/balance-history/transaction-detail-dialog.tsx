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
import { IsLoading } from "@/components/ui/is-loading";
import type {
  BalanceOperationWithClient,
  OrderPaymentDetail,
  ShipmentDetail,
} from "@/server/balance";
import { getOrderPaymentDetail, getShipmentDetail } from "@/server/balance";
import { type BalanceOperationType, balanceOperationLabels } from "../types";

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: BalanceOperationWithClient;
}

export function TransactionDetailDialog({
  open,
  onOpenChange,
  operation,
}: TransactionDetailDialogProps) {
  const opType = operation.type as BalanceOperationType;
  const amount = parseFloat(operation.amount);
  const isPositive = amount >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {balanceOperationLabels[opType] ?? operation.type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Общие данные */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Клиент:</span>
            <span className="font-medium">{operation.clientName || "—"}</span>
          </div>

          {/* Детали по типу */}
          {opType === "order" && operation.referenceId && (
            <OrderDetails referenceId={operation.referenceId} />
          )}
          {opType === "shipping" && operation.referenceId && (
            <ShippingDetails referenceId={operation.referenceId} />
          )}
          {opType === "deposit" && <DepositDetails operation={operation} />}
          {(opType === "commission" || opType === "manual") && (
            <ManualDetails operation={operation} />
          )}

          {/* Сумма */}
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground">Сумма:</span>
            <span
              className={`font-medium tabular-nums ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? "+" : ""}
              {amount.toLocaleString("ru-RU")} с
            </span>
          </div>

          {/* Дата */}
          {operation.createdAt && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Дата:</span>
              <span>
                {new Date(operation.createdAt).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Детали оплаты товаров ──────────────────────────────────────

function OrderDetails({ referenceId }: { referenceId: string }) {
  const [detail, setDetail] = useState<OrderPaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getOrderPaymentDetail(referenceId).then((d) => {
      setDetail(d);
      setIsLoading(false);
    });
  }, [referenceId]);

  if (isLoading) return <IsLoading />;
  if (!detail)
    return <p className="text-muted-foreground">Данные не найдены</p>;

  return (
    <div className="space-y-2">
      {detail.supplierName && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Поставщик:</span>
          <span>{detail.supplierName}</span>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-muted-foreground text-xs">Товары:</p>
        {detail.items.map((item) => (
          <div key={item.id} className="flex justify-between text-xs pl-2">
            <span>
              {item.name}
              {item.size ? ` (${item.size})` : ""} ×{item.quantity}
            </span>
            <span className="tabular-nums">
              {(parseFloat(item.purchasePrice) * item.quantity).toLocaleString(
                "ru-RU",
              )}
              с
            </span>
          </div>
        ))}
      </div>

      {detail.purchaseTotal !== detail.buyerTotal && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Закупка:</span>
          <span className="tabular-nums">
            {parseFloat(detail.purchaseTotal).toLocaleString("ru-RU")} с
          </span>
        </div>
      )}
    </div>
  );
}

// ── Детали доставки ────────────────────────────────────────────

function ShippingDetails({ referenceId }: { referenceId: string }) {
  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getShipmentDetail(referenceId).then((d) => {
      setDetail(d);
      setIsLoading(false);
    });
  }, [referenceId]);

  if (isLoading) return <IsLoading />;
  if (!detail)
    return <p className="text-muted-foreground">Данные не найдены</p>;

  return (
    <div className="space-y-1">
      {detail.code && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Отправка:</span>
          <span>#{detail.code}</span>
        </div>
      )}
      {detail.destination && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Куда:</span>
          <span>{detail.destination}</span>
        </div>
      )}
      {detail.notes && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Комментарий:</span>
          <span className="truncate max-w-40">{detail.notes}</span>
        </div>
      )}
    </div>
  );
}

// ── Детали пополнения ──────────────────────────────────────────

function DepositDetails({
  operation,
}: {
  operation: BalanceOperationWithClient;
}) {
  const amountForeign = parseFloat(operation.amountForeign || "0");
  const rateReal = parseFloat(operation.rateReal || "0");
  const rateClient = parseFloat(operation.rateClient || "0");
  const spread = amountForeign * (rateReal - rateClient);

  return (
    <div className="space-y-1">
      {amountForeign > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Сумма:</span>
          <span>
            {amountForeign.toLocaleString("ru-RU")} {operation.currencyCode}
          </span>
        </div>
      )}
      {rateReal > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Курс реальный:</span>
          <span>{rateReal}</span>
        </div>
      )}
      {rateClient > 0 && rateClient !== rateReal && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Курс для клиента:</span>
          <span>{rateClient}</span>
        </div>
      )}
      {spread !== 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Курсовой спред:</span>
          <span className={spread > 0 ? "text-green-600" : "text-red-600"}>
            {spread > 0 ? "+" : ""}
            {spread.toLocaleString("ru-RU")} с
          </span>
        </div>
      )}
    </div>
  );
}

// ── Детали ручной операции / комиссии ──────────────────────────

function ManualDetails({
  operation,
}: {
  operation: BalanceOperationWithClient;
}) {
  if (!operation.description) return null;

  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">Описание:</span>
      <span className="truncate max-w-40">{operation.description}</span>
    </div>
  );
}
