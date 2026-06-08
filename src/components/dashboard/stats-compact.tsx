"use client";

import { RefreshCwIcon } from "lucide-react";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardStats } from "@/server/dashboard";
import { useClientsStore } from "@/stores/clients-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { Button } from "../ui/button";

export function StatsCompact() {
  const isLoading = useDashboardStore((s) => s.isLoading);
  const fetchStats = useDashboardStore((s) => s.fetchStats);
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const stats = useDashboardStore((s) => s.stats);

  useEffect(() => {
    fetchStats();
    fetchClients();
  }, [fetchStats, fetchClients]);

  return (
    <Tabs defaultValue="today">
      <TabsList className="w-full">
        <TabsTrigger value="today" className="flex-1">
          Сегодня
        </TabsTrigger>
        <TabsTrigger value="month" className="flex-1">
          Месяц
        </TabsTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => fetchStats(true)}
          disabled={isLoading}
        >
          <RefreshCwIcon
            className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      </TabsList>

      {stats && (
        <>
          <TabsContent value="today">
            <PeriodCard label="За сегодня" data={stats.today} />
          </TabsContent>

          <TabsContent value="month">
            <PeriodCard label="За месяц" data={stats.month} />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}

function PeriodCard({
  label,
  data,
}: {
  label: string;
  data: DashboardStats["today"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs text-muted-foreground font-medium">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2">
        <p className="text-2xl font-bold text-green-600 tabular-nums">
          +{data.total.toLocaleString("ru-RU")}с
        </p>
        <div className="text-right text-xs space-y-0.5 text-muted-foreground">
          <p className="flex justify-between">
            Комиссия:{" "}
            <span className="text-foreground font-medium">
              {data.commission.toLocaleString("ru-RU")}с
            </span>
          </p>
          <p className="flex justify-between">
            Спред:{" "}
            <span className="text-foreground font-medium">
              {data.spread.toLocaleString("ru-RU")}с
            </span>
          </p>
          <p className="flex justify-between">
            Скидка:{" "}
            <span className="text-foreground font-medium">
              {data.orderDiscount.toLocaleString("ru-RU")}с
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
