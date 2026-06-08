"use client";

import { RefreshCwIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IsLoading } from "@/components/ui/is-loading";
import { useDashboardStore } from "@/stores/dashboard-store";
import { StatsDetail } from "./stats-detail";
import { TopClients } from "./top-clients";

export function AnalyticsContent() {
  const stats = useDashboardStore((s) => s.stats);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const fetchStats = useDashboardStore((s) => s.fetchStats);

  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  if (isLoading && !stats) return <IsLoading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Подробная статистика заработка
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => fetchStats(true)}
          disabled={isLoading}
        >
          <RefreshCwIcon
            className={`size-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {stats && (
        <>
          {/* Сравнение с прошлым месяцем */}
          {stats.monthComparison && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    К прошлому месяцу
                  </span>
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      stats.monthComparison.changePercent >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stats.monthComparison.changePercent >= 0 ? "+" : ""}
                    {stats.monthComparison.changePercent.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Прошлый месяц:{" "}
                  {stats.monthComparison.previousTotal.toLocaleString("ru-RU")}с
                </p>
              </CardContent>
            </Card>
          )}

          <StatsDetail label="Месяц" data={stats.month} />
          <StatsDetail label="Год" data={stats.year} />

          {/* Топ поставщик */}
          {stats.topSupplier && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Топ поставщик (месяц)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {stats.topSupplier.supplierName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.topSupplier.ordersCount} заказов
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {stats.topSupplier.totalSpent.toLocaleString("ru-RU")}с
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Долг клиентов */}
          {stats.clientDebt > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Долг клиентов
                  </span>
                  <span className="text-lg font-bold text-red-600 tabular-nums">
                    -{stats.clientDebt.toLocaleString("ru-RU")}с
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <TopClients clients={stats.topClients} />
        </>
      )}
    </div>
  );
}
