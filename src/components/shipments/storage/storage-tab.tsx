"use client";

import { ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import { ClientChips } from "@/components/orders/client-chips";
import { Button } from "@/components/ui/button";
import { IsLoading } from "@/components/ui/is-loading";
import { LengthZero } from "@/components/ui/length-zero";
import { useShipmentHistoryStore } from "@/stores/shipment-history-store";
import { useShipmentsStore } from "@/stores/shipments-store";
import { type StorageItem, useStorageStore } from "@/stores/storage-store";
import { CartFab } from "./cart-fab";
import { CreateShipmentDialog } from "./create-shipment-dialog";
import { EditStorageDialog } from "./edit-storage-dialog";
import { StorageItemCard } from "./storage-item-card";

export interface CartItem {
  storageItemId: string;
  name: string;
  size: string | null;
  maxQuantity: number;
  quantity: number;
  clientId: string;
}

export function StorageTab() {
  const items = useStorageStore((s) => s.items);
  const isLoading = useStorageStore((s) => s.isLoading);
  const refresh = useStorageStore((s) => s.refresh);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<StorageItem | null>(null);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  const filteredItems = useMemo(() => {
    if (!activeClientId) return items;
    return items.filter((item) => item.clientId === activeClientId);
  }, [items, activeClientId]);

  const filteredInCart = useMemo(() => {
    let count = 0;
    for (const item of filteredItems) {
      if (cart.has(item.id)) count++;
    }
    return count;
  }, [filteredItems, cart]);

  const cartClientIds = useMemo(() => {
    const ids = new Set<string>();
    for (const item of cart.values()) {
      ids.add(item.clientId);
    }
    return Array.from(ids);
  }, [cart]);

  function toggleItem(item: StorageItem) {
    setCart((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, {
          storageItemId: item.id,
          name: item.name,
          size: item.size,
          maxQuantity: item.quantity,
          quantity: item.quantity,
          clientId: item.clientId,
        });
      }
      return next;
    });
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const item = next.get(id);
      if (item) {
        const clamped = Math.max(1, Math.min(quantity, item.maxQuantity));
        next.set(id, { ...item, quantity: clamped });
      }
      return next;
    });
  }

  function selectAll() {
    setCart((prev) => {
      const next = new Map(prev);
      for (const item of filteredItems) {
        if (!next.has(item.id)) {
          next.set(item.id, {
            storageItemId: item.id,
            name: item.name,
            size: item.size,
            maxQuantity: item.quantity,
            quantity: item.quantity,
            clientId: item.clientId,
          });
        }
      }
      return next;
    });
  }

  function clearFiltered() {
    setCart((prev) => {
      const next = new Map(prev);
      for (const item of filteredItems) {
        next.delete(item.id);
      }
      return next;
    });
  }

  function clearAll() {
    setCart(new Map());
  }

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={selectAll}
          >
            <ListChecks className="size-4 mr-1.5" />
            Выбрать всё
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-muted-foreground"
            onClick={clearFiltered}
            disabled={filteredInCart === 0}
          >
            Очистить{filteredInCart > 0 && ` (${filteredInCart})`}
          </Button>
        </div>
      )}

      <ClientChips
        items={items}
        activeClientId={activeClientId}
        onChange={setActiveClientId}
      />

      {isLoading ? (
        <IsLoading />
      ) : filteredItems.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-2 pb-24">
          {filteredItems.map((item) => (
            <StorageItemCard
              key={item.id}
              item={item}
              cartItem={cart.get(item.id)}
              onToggle={toggleItem}
              onEdit={setEditItem}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>
      )}

      {cart.size > 0 && (
        <CartFab count={cart.size} onClick={() => setShipmentOpen(true)} />
      )}

      {editItem && (
        <EditStorageDialog
          open={!!editItem}
          onOpenChange={() => setEditItem(null)}
          item={editItem}
          onSuccess={() => refresh()}
        />
      )}

      {shipmentOpen && (
        <CreateShipmentDialog
          open={shipmentOpen}
          onOpenChange={setShipmentOpen}
          cart={Array.from(cart.values())}
          cartClientIds={cartClientIds}
          onSuccess={() => {
            clearAll();
            refresh();
            useShipmentsStore.getState().refresh();
            useShipmentHistoryStore.getState().refresh();
          }}
        />
      )}
    </div>
  );
}
