"use client";

import { Pencil, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { IsLoading } from "@/components/ui/is-loading";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { LengthZero } from "@/components/ui/length-zero";
import { deleteShipment } from "@/server/shipments";
import { useShipmentHistoryStore } from "@/stores/shipment-history-store";
import { type Shipment, useShipmentsStore } from "@/stores/shipments-store";
import { useStorageStore } from "@/stores/storage-store";
import { EditPreparingDialog } from "./edit-preparing-dialog";
import { ShipDialog } from "./ship-dialog";

export function PreparingTab() {
  const shipments = useShipmentsStore((s) => s.items);
  const isLoading = useShipmentsStore((s) => s.isLoading);
  const refresh = useShipmentsStore((s) => s.refresh);
  const [editShipment, setEditShipment] = useState<Shipment | null>(null);
  const [shipShipment, setShipShipment] = useState<Shipment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    await deleteShipment(deleteId);
    setDeleteId(null);
    await refresh();
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <IsLoading />
      ) : shipments.length === 0 ? (
        <LengthZero />
      ) : (
        shipments.map((shipment) => (
          <Item key={shipment.id} variant="outline" size="xs">
            <ItemContent>
              <ItemTitle>{shipment.clientName || "—"}</ItemTitle>
              <ItemDescription>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  {shipment.items.map((item) => (
                    <span key={item.id} className="text-muted-foreground">
                      {item.name}
                      {item.size && ` (${item.size})`} ×{item.quantity}
                    </span>
                  ))}
                </div>
              </ItemDescription>
            </ItemContent>

            <ItemActions>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setEditShipment(shipment)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                onClick={() => setDeleteId(shipment.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </ItemActions>

            <ItemSeparator />

            <ItemFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShipShipment(shipment)}
              >
                <Send className="size-3.5 mr-1.5 shrink-0" />

                {shipment.destination}
              </Button>
            </ItemFooter>
          </Item>
        ))
      )}

      {editShipment && (
        <EditPreparingDialog
          open={!!editShipment}
          onOpenChange={() => setEditShipment(null)}
          shipment={editShipment}
          onSuccess={() => {
            refresh();
            useStorageStore.getState().refresh();
            useShipmentHistoryStore.getState().refresh();
          }}
        />
      )}

      {shipShipment && (
        <ShipDialog
          open={!!shipShipment}
          onOpenChange={() => setShipShipment(null)}
          shipmentId={shipShipment.id}
          defaultCode={shipShipment.code}
          onSuccess={() => {
            refresh();
            useShipmentHistoryStore.getState().refresh();
          }}
        />
      )}

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить отправку?"
        description="Товары вернутся на склад."
      />
    </div>
  );
}
