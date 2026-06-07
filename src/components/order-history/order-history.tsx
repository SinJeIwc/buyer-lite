"use client";

import { useEffect, useState } from "react";
import { ClientChips } from "@/components/orders/client-chips";
import { IsLoading } from "@/components/ui/is-loading";
import { useOrderHistoryStore } from "@/stores/order-history-store";
import { OrderPaymentCard } from "./order-payment-card";

export function OrderHistory() {
  const payments = useOrderHistoryStore((s) => s.items);
  const isLoading = useOrderHistoryStore((s) => s.isLoading);
  const fetchPayments = useOrderHistoryStore((s) => s.fetchItems);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  // Всегда загружаем свежие данные при заходе на страницу
  useEffect(() => {
    fetchPayments(true);
  }, [fetchPayments]);

  // Фильтрация
  const filteredPayments = activeClientId
    ? payments.filter((p) => p.clientId === activeClientId)
    : payments;

  return (
    <>
      {/* Чипсы клиентов */}
      <ClientChips
        items={payments.map((p) => ({
          clientId: p.clientId,
          clientName: p.clientName,
        }))}
        activeClientId={activeClientId}
        onChange={setActiveClientId}
      />

      {/* Список оплат */}
      {isLoading ? (
        <IsLoading />
      ) : filteredPayments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Нет оплат
        </p>
      ) : (
        <div className="space-y-2">
          {filteredPayments.map((payment) => (
            <OrderPaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </>
  );
}
