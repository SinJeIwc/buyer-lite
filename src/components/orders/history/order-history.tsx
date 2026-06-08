"use client";

import { useEffect, useMemo, useState } from "react";
import { ClientChips } from "@/components/orders/client-chips";
import { IsLoading } from "@/components/ui/is-loading";
import { useOrderHistoryStore } from "@/stores/order-history-store";
import { OrderPaymentCard } from "./order-payment-card";

export function OrderHistory() {
  const payments = useOrderHistoryStore((s) => s.items);
  const isLoading = useOrderHistoryStore((s) => s.isLoading);
  const fetchPayments = useOrderHistoryStore((s) => s.fetchItems);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments(true);
  }, [fetchPayments]);

  // Фильтрация
  const filteredPayments = activeClientId
    ? payments.filter((p) => p.clientId === activeClientId)
    : payments;

  // Группировка по датам
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filteredPayments>();
    for (const p of filteredPayments) {
      if (!p.createdAt) continue;
      const dateKey = new Date(p.createdAt).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const arr = groups.get(dateKey);
      if (arr) arr.push(p);
      else groups.set(dateKey, [p]);
    }
    return Array.from(groups.entries());
  }, [filteredPayments]);

  return (
    <>
      <ClientChips
        items={payments.map((p) => ({
          clientId: p.clientId,
          clientName: p.clientName,
        }))}
        activeClientId={activeClientId}
        onChange={setActiveClientId}
      />

      {isLoading ? (
        <IsLoading />
      ) : filteredPayments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Нет оплат
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground px-1">
                {date}
              </h3>
              {items.map((payment) => (
                <OrderPaymentCard key={payment.id} payment={payment} />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
