"use client";

import type { OrderHistoryStats } from "@/server/order-history";

interface StatsCardsProps {
  stats: OrderHistoryStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  function format(num: number) {
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 0 });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="p-3 rounded-lg border bg-muted/30">
        <div className="text-xs text-muted-foreground">Оплат</div>
        <div className="text-lg font-bold">{stats.paymentCount}</div>
      </div>
      <div className="p-3 rounded-lg border bg-muted/30">
        <div className="text-xs text-muted-foreground">Товаров</div>
        <div className="text-lg font-bold">{stats.totalItems}</div>
      </div>
      <div className="p-3 rounded-lg border bg-muted/30">
        <div className="text-xs text-muted-foreground">Для клиентов</div>
        <div className="text-lg font-bold">{format(stats.totalClient)} с</div>
      </div>
      <div className="p-3 rounded-lg border bg-muted/30">
        <div className="text-xs text-muted-foreground">Закупка</div>
        <div className="text-lg font-bold">{format(stats.totalPurchase)} с</div>
      </div>
      <div className="col-span-2 p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
        <div className="text-xs text-muted-foreground">Маржа</div>
        <div className="text-lg font-bold text-green-600">
          {format(stats.totalMargin)} с
        </div>
      </div>
    </div>
  );
}
