"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PeriodStats } from "@/server/dashboard";

interface StatsDetailProps {
  label: string;
  data: PeriodStats;
}

export function StatsDetail({ label, data }: StatsDetailProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Общий итог */}
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="text-sm text-muted-foreground">Заработано</span>
          <span className="text-xl font-bold text-green-600 tabular-nums">
            +{data.total.toLocaleString("ru-RU")}с
          </span>
        </div>

        {/* Детали по источникам */}
        <div className="space-y-2">
          <Row
            label="Комиссия"
            value={data.commission}
            description="% от стоимости товаров"
          />
          <Row
            label="Спред курса"
            value={data.spread}
            description="Разница курсов при обмене"
          />
          <Row
            label="Скидка при оплате"
            value={data.orderDiscount}
            description="Маржа между закупкой и ценой клиента"
          />
        </div>

        {/* Расходы */}
        {data.shipping > 0 && (
          <div className="pt-2 border-t">
            <Row
              label="Доставка (списано)"
              value={data.shipping}
              description="Стоимость карго"
              isExpense
            />
          </div>
        )}

        {/* Метрики */}
        <div className="pt-2 border-t space-y-2">
          <MetricRow label="Заказов" value={data.ordersCount} suffix="шт" />
          <MetricRow label="Отправок" value={data.shipmentsCount} suffix="шт" />
          {data.avgOrderValue > 0 && (
            <MetricRow
              label="Средний чек"
              value={Math.round(data.avgOrderValue)}
              suffix="с"
            />
          )}
          {data.avgCommission > 0 && (
            <MetricRow
              label="Средняя комиссия"
              value={Math.round(data.avgCommission)}
              suffix="с"
            />
          )}
          {data.marginPercent > 0 && (
            <MetricRow
              label="Маржа"
              value={Math.round(data.marginPercent * 10) / 10}
              suffix="%"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  description,
  isExpense,
}: {
  label: string;
  value: number;
  description?: string;
  isExpense?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <span
        className={`text-sm font-medium tabular-nums ${
          isExpense
            ? "text-red-600"
            : value > 0
              ? "text-green-600"
              : "text-muted-foreground"
        }`}
      >
        {isExpense ? "-" : value > 0 ? "+" : ""}
        {value.toLocaleString("ru-RU")}с
      </span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">
        {value.toLocaleString("ru-RU")}
        {suffix}
      </span>
    </div>
  );
}
