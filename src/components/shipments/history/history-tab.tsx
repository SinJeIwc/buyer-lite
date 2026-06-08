"use client";

import { Pencil, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { revertShipmentToPreparing } from "@/server/shipments";
import { useShipmentHistoryStore } from "@/stores/shipment-history-store";
import type { Shipment } from "@/stores/shipments-store";
import { useShipmentsStore } from "@/stores/shipments-store";
import { HistoryEditDialog } from "./history-edit-dialog";
import { ShipmentReportButton } from "./shipment-report-button";

export function HistoryTab() {
  const shipments = useShipmentHistoryStore((s) => s.items);
  const isLoading = useShipmentHistoryStore((s) => s.isLoading);
  const fetchItems = useShipmentHistoryStore((s) => s.fetchItems);
  const lastFetched = useShipmentHistoryStore((s) => s.lastFetched);
  const [editShipment, setEditShipment] = useState<Shipment | null>(null);
  const [revertId, setRevertId] = useState<string | null>(null);

  useEffect(() => {
    // Загружаем только если данные ещё не загружались
    if (!lastFetched) {
      fetchItems(true);
    }
  }, [fetchItems, lastFetched]);

  async function handleRevert() {
    if (!revertId) return;
    await revertShipmentToPreparing(revertId);
    setRevertId(null);
    await fetchItems(true);
    await useShipmentsStore.getState().refresh();
  }

  // Группировка по дате
  const grouped = shipments.reduce<Record<string, typeof shipments>>(
    (acc, s) => {
      const date = s.shippedAt
        ? new Date(s.shippedAt).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "Без даты";
      if (!acc[date]) acc[date] = [];
      acc[date].push(s);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      {isLoading ? (
        <IsLoading />
      ) : shipments.length === 0 ? (
        <LengthZero />
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {date}
            </h3>
            {items.map((shipment) => (
              <Item key={shipment.id} variant="outline" size="xs">
                <ItemContent>
                  <ItemTitle className="flex items-center gap-2">
                    <span className="truncate">{shipment.clientName}</span>
                  </ItemTitle>
                  <ItemDescription>
                    {shipment.destination && (
                      <span>{shipment.destination}</span>
                    )}
                    {shipment.code && (
                      <span className="ml-1">#{shipment.code}</span>
                    )}
                    <span className="grid gap-x-3 gap-y-0.5 text-xs">
                      {shipment.items.map((item) => (
                        <span key={item.id}>
                          {item.name}
                          {item.size && ` (${item.size})`} ×{item.quantity}
                        </span>
                      ))}
                    </span>
                  </ItemDescription>
                </ItemContent>

                <ItemActions>
                  <ShipmentReportButton shipment={shipment} />
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
                    className="size-8"
                    onClick={() => setRevertId(shipment.id)}
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </ItemActions>

                <ItemSeparator />

                <ItemFooter>
                  <span className="text-xs text-muted-foreground truncate max-w-32">
                    {shipment.notes}
                  </span>

                  {shipment.shippingCost && (
                    <span className="text-sm font-medium">
                      <span className="mr-1">Доставка:</span>
                      {parseFloat(shipment.shippingCost).toLocaleString(
                        "ru-RU",
                      )}
                      с
                    </span>
                  )}
                </ItemFooter>
              </Item>
            ))}
          </div>
        ))
      )}

      {editShipment && (
        <HistoryEditDialog
          open={!!editShipment}
          onOpenChange={() => setEditShipment(null)}
          shipment={editShipment}
          onSuccess={() => fetchItems(true)}
        />
      )}

      <AlertDialog open={!!revertId} onOpenChange={() => setRevertId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вернуть в «Готовится»?</AlertDialogTitle>
            <AlertDialogDescription>
              Отправка будет возвращена в статус подготовки.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert}>
              Вернуть
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
