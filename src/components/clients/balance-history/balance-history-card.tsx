"use client";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import type { BalanceOperationWithClient } from "@/server/balance";
import { type BalanceOperationType, balanceOperationLabels } from "../types";

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
  const amount = parseFloat(operation.amount);
  const isPositive = amount >= 0;
  const opType = operation.type as BalanceOperationType;

  return (
    <Item variant="outline" size="xs">
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
      </ItemContent>
    </Item>
  );
}
