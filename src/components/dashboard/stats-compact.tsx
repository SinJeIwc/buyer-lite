"use client";

import { RefreshCwIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardStats } from "@/server/dashboard";
import { useClientsStore } from "@/stores/clients-store";
import { useDashboardStore } from "@/stores/dashboard-store";

const emptyStats: DashboardStats["today"] = {
  total: 0,
  commission: 0,
  spread: 0,
  orderDiscount: 0,
  shipping: 0,
  count: 0,
};

export function StatsCompact() {
  const isLoading = useDashboardStore((s) => s.isLoading);
  const fetchStats = useDashboardStore((s) => s.fetchStats);
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const stats = useDashboardStore((s) => s.stats);

  useEffect(() => {
    fetchStats();
    fetchClients();
  }, [fetchStats, fetchClients]);

  const today = stats?.today ?? emptyStats;
  const month = stats?.month ?? emptyStats;

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

      <TabsContent value="today">
        <PeriodCard label="За сегодня" data={today} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="month">
        <PeriodCard label="За месяц" data={month} isLoading={isLoading} />
      </TabsContent>
    </Tabs>
  );
}

function PeriodCard({
  label,
  data,
  isLoading,
}: {
  label: string;
  data: DashboardStats["today"];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 items-center">
        <AnimatedNumber
          value={data.total}
          prefix="+"
          suffix="с"
          className="text-2xl font-bold text-green-600"
          isLoading={isLoading}
        />
        <div className="text-right text-xs space-y-0.5 text-muted-foreground">
          <Row label="Комиссия" value={data.commission} isLoading={isLoading} />
          <Row label="Спред" value={data.spread} isLoading={isLoading} />
          <Row
            label="Скидка"
            value={data.orderDiscount}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <p className="flex justify-between gap-2">
      {label}:{" "}
      <AnimatedNumber
        value={value}
        suffix="с"
        className="text-foreground font-medium"
        isLoading={isLoading}
      />
    </p>
  );
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  className,
  isLoading,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  isLoading: boolean;
}) {
  return (
    <span className={`tabular-nums inline-block ${className ?? ""}`}>
      {prefix}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={isLoading ? "loading" : value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? "0" : value.toLocaleString("ru-RU")}
        </motion.span>
      </AnimatePresence>
      {suffix}
    </span>
  );
}
