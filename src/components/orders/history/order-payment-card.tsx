"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from "@/components/ui/item";
import type { OrderPaymentWithItems } from "@/server/order-history";

interface OrderPaymentCardProps {
  payment: OrderPaymentWithItems;
}

export function OrderPaymentCard({ payment }: OrderPaymentCardProps) {
  const [expanded, setExpanded] = useState(false);

  function format(num: string | number) {
    return parseFloat(String(num)).toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
    });
  }

  function formatDate(date: Date | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  }

  const buyerTotal = parseFloat(payment.buyerTotal);
  const purchaseTotal = parseFloat(payment.purchaseTotal);
  const margin = buyerTotal - purchaseTotal;

  return (
    <Item variant="outline" size="xs">
      <ItemContent>
        <ItemTitle className="flex items-center justify-between">
          <span className="truncate">
            {payment.clientName || "—"}
            <span className="text-muted-foreground font-normal ml-2">
              {payment.supplierName || "—"}
            </span>
          </span>
          {/*<span className="text-sm font-bold shrink-0 ml-2">
            {format(buyerTotal)} с
          </span>*/}
        </ItemTitle>
        <ItemDescription className="flex items-center gap-2 text-xs">
          <span>{formatDate(payment.createdAt)}</span>
          <span>•</span>
          <span>{payment.items.length} товаров</span>
          <span>•</span>
          <span>{format(buyerTotal)} с</span>
        </ItemDescription>

        {/* Детали */}
        {expanded && (
          <div className="mt-2 space-y-1 border-t pt-2">
            {payment.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="truncate">
                  {item.name}
                  {item.size && (
                    <span className="text-muted-foreground ml-1">
                      ({item.size})
                    </span>
                  )}
                  <span className="text-muted-foreground ml-1">
                    ×{item.quantity}
                  </span>
                </span>
                <span className="shrink-0 ml-2">
                  {format(item.purchasePrice)} с
                </span>
              </div>
            ))}
            <div className="grid grid-cols-2 text-xs font-medium pt-1 border-t">
              <span>Маржа</span>
              <span className="text-green-600 ml-auto">
                +{format(margin)} с
              </span>
              <span>Итоговая сумма</span>
              <span className="ml-auto">{format(purchaseTotal)} с</span>
            </div>
          </div>
        )}
      </ItemContent>
      <ItemFooter>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs justify-end w-full px-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              Скрыть <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Детали <ChevronDown className="w-3 h-3" />
            </>
          )}
        </Button>
      </ItemFooter>
    </Item>
  );
}
