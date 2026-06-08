"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShipmentHistoryStore } from "@/stores/shipment-history-store";
import { useShipmentsStore } from "@/stores/shipments-store";
import { useStorageStore } from "@/stores/storage-store";
import { HistoryTab } from "./history/history-tab";
import { PreparingTab } from "./preparing/preparing-tab";
import { StorageTab } from "./storage/storage-tab";

export function ShipmentsTabs() {
  const fetchStorage = useStorageStore((s) => s.fetchItems);
  const fetchShipments = useShipmentsStore((s) => s.fetchItems);
  const fetchHistory = useShipmentHistoryStore((s) => s.fetchItems);
  const refreshStorage = useStorageStore((s) => s.refresh);
  const isLoadingStorage = useStorageStore((s) => s.isLoading);
  const isLoadingShipments = useShipmentsStore((s) => s.isLoading);
  const isLoadingHistory = useShipmentHistoryStore((s) => s.isLoading);

  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchStorage();
    useShipmentsStore.getState().refresh();
  }, [fetchStorage]);

  async function handleRefresh() {
    await Promise.all([
      refreshStorage(),
      fetchShipments(true),
      fetchHistory(true),
    ]);
  }

  const isLoading = isLoadingStorage || isLoadingShipments || isLoadingHistory;

  return (
    <Tabs defaultValue="storage">
      <TabsList className="w-full">
        <TabsTrigger value="storage" className="flex-1">
          Склад
        </TabsTrigger>
        <TabsTrigger
          value="shipments"
          className="flex-1"
          onClick={() => setShowHistory(false)}
        >
          Отправки
        </TabsTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </TabsList>

      <TabsContent value="storage">
        <StorageTab />
      </TabsContent>

      <TabsContent value="shipments" className="space-y-2">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? "Отменить" : "История"}
          </Button>
        </div>
        {showHistory ? <HistoryTab /> : <PreparingTab />}
      </TabsContent>
    </Tabs>
  );
}
