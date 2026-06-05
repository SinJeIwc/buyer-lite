"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useItemsStore } from "@/stores/items-store";
import { useSuppliersStore } from "@/stores/suppliers-store";
import { ItemsTab } from "./items-tab";
import { SuppliersTab } from "./suppliers-tab";

export function OrdersTabs() {
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);
  const fetchItems = useItemsStore((s) => s.fetchItems);
  const refreshSuppliers = useSuppliersStore((s) => s.refresh);
  const refreshItems = useItemsStore((s) => s.refresh);
  const isLoadingSuppliers = useSuppliersStore((s) => s.isLoading);
  const isLoadingItems = useItemsStore((s) => s.isLoading);

  useEffect(() => {
    fetchSuppliers();
    fetchItems();
  }, [fetchSuppliers, fetchItems]);

  async function handleRefresh() {
    await Promise.all([refreshSuppliers(), refreshItems()]);
  }

  const isLoading = isLoadingSuppliers || isLoadingItems;

  return (
    <Tabs defaultValue="suppliers">
      <TabsList className="w-full">
        <TabsTrigger value="suppliers" className="flex-1">
          Поставщики
        </TabsTrigger>
        <TabsTrigger value="items" className="flex-1">
          Товары
        </TabsTrigger>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </TabsList>
      <TabsContent value="suppliers">
        <SuppliersTab />
      </TabsContent>
      <TabsContent value="items">
        <ItemsTab />
      </TabsContent>
    </Tabs>
  );
}
