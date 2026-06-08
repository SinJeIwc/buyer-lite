"use client";

import { Pencil, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const [isReverting, setIsReverting] = useState(false);

  useEffect(() => {
    // Загружаем только если данные ещё не загружались
    if (!lastFetched) {
      fetchItems(true);
    }
  }, [fetchItems, lastFetched]);

  async function handleRevert() {
    if (!revertId || isReverting) return;
    setIsReverting(true);
    try {
      await revertShipmentToPreparing(revertId);
      setRevertId(null);
      await fetchItems(true);
      await useShipmentsStore.getState().refresh();
    } finally {
      setIsReverting(false);
    }
  }

  // Группировка по дате (новые сверху)
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof shipments>();
    for (const s of shipments) {
      const date = s.shippedAt
        ? new Date(s.shippedAt).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "Без даты";
      const arr = groups.get(date);
      if (arr) arr.push(s);
      else groups.set(date, [s]);
    }
    return Array.from(groups.entries());
  }, [shipments]);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <IsLoading />
      ) : shipments.length === 0 ? (
        <LengthZero />
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {date}
            </h3>
            {items.map((shipment) => (
              <Item key={shipment.id} variant="outline" size="xs">
                <ItemContent>
                  <ItemTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{shipment.clientName}</span>
                    {shipment.shippedAt && (
                      <span className="text-xs text-muted-foreground font-normal">
                        {new Date(shipment.shippedAt).toLocaleTimeString(
                          "ru-RU",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    )}
                  </ItemTitle>
                  <ItemDescription>
                    {shipment.destination && (
                      <span>{shipment.destination}</span>
                    )}
                    {shipment.code && (
                      <span className="ml-1">#{shipment.code}</span>
                    )}
                    {shipment.notes && (
                      <span className="block text-muted-foreground mt-0.5">
                        {shipment.notes}
                      </span>
                    )}
                    <span className="grid gap-x-3 gap-y-0.5 text-xs mt-1">
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
                  <div className="flex items-center gap-2">
                    {shipment.shippingCost && (
                      <span className="text-xs">
                        Доставка:{" "}
                        {parseFloat(shipment.shippingCost).toLocaleString(
                          "ru-RU",
                        )}
                        с
                      </span>
                    )}
                    {shipment.commissionAmount &&
                      parseFloat(shipment.commissionAmount) > 0 && (
                        <span className="text-xs">
                          Комиссия:{" "}
                          {parseFloat(shipment.commissionAmount).toLocaleString(
                            "ru-RU",
                          )}
                          с
                        </span>
                      )}
                  </div>
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
            <AlertDialogCancel disabled={isReverting}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert} disabled={isReverting}>
              {isReverting ? "Возврат..." : "Вернуть"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
