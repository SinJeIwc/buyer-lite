"use client";

import { useState } from "react";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import type { BalanceOperationWithClient } from "@/server/balance";
import { type BalanceOperationType, balanceOperationLabels } from "../types";
import { TransactionDetailDialog } from "./transaction-detail-dialog";

const typeColors: Record<BalanceOperationType, string> = {
  deposit: "text-green-600",
  order: "text-red-600",
  shipping: "text-red-600",
  commission: "text-red-600",
  manual: "text-muted-foreground",
};

interface BalanceHistoryCardProps {
  operation: BalanceOperationWithClient;
}

export function BalanceHistoryCard({ operation }: BalanceHistoryCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const amount = parseFloat(operation.amount);
  const isPositive = amount >= 0;
  const opType = operation.type as BalanceOperationType;

  return (
    <>
      <Item
        variant="outline"
        size="xs"
        className="cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => setDetailOpen(true)}
      >
        <ItemContent>
          <ItemTitle className="flex items-center justify-between gap-2">
            <span className="truncate">{operation.clientName || "—"}</span>
            <span
              className={`text-sm font-medium tabular-nums ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? "+" : ""}
              {amount.toLocaleString("ru-RU")} с
            </span>
          </ItemTitle>
          <ItemDescription className="flex items-center gap-2">
            <span className={typeColors[opType]}>
              {balanceOperationLabels[opType] ?? operation.type}
            </span>
            {operation.description && (
              <span className="text-muted-foreground truncate">
                · {operation.description}
              </span>
            )}
          </ItemDescription>
          {operation.type === "deposit" && operation.amountForeign && (
            <p className="text-xs text-muted-foreground mt-1">
              {parseFloat(operation.amountForeign).toLocaleString("ru-RU")}{" "}
              {operation.currencyCode} × {operation.rateClient}
            </p>
          )}
          {operation.createdAt && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(operation.createdAt).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </ItemContent>
      </Item>

      <TransactionDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        operation={operation}
      />
    </>
  );
}
