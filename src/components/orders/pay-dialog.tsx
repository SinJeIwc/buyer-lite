"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { type PayItem, paySupplierItems } from "@/server/supplier-items";
import { useClientsStore } from "@/stores/clients-store";
import { useItemsStore } from "@/stores/items-store";
import { ClientSelect } from "./pay/client-select";
import { ItemSearch } from "./pay/item-search";
import { PriceSummary } from "./pay/price-summary";
import type { SelectedItem } from "./pay/selected-items";
import { SelectedItems } from "./pay/selected-items";

interface PayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  onSuccess: () => void;
}

export function PayDialog({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  onSuccess,
}: PayDialogProps) {
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const refreshClients = useClientsStore((s) => s.refresh);
  const refreshItems = useItemsStore((s) => s.refresh);

  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [clientPriceTotal, setClientPriceTotal] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      setClientId(null);
      setSelectedItems([]);
      setClientPriceTotal("");
      setIsLocked(true);
    }
  }, [open, fetchClients]);

  // Автоматический расчёт
  const totalPurchase = selectedItems.reduce(
    (sum, i) => sum + i.purchasePrice * i.quantity,
    0,
  );

  useEffect(() => {
    if (isLocked) {
      setClientPriceTotal(totalPurchase.toFixed(0));
    }
  }, [totalPurchase, isLocked]);

  const handleSelectItem = useCallback(
    (item: {
      id: string;
      name: string;
      size: string | null;
      quantity: number;
      purchasePrice: string;
    }) => {
      setSelectedItems((prev) => [
        ...prev,
        {
          _id: Math.random().toString(36).slice(2),
          supplierItemId: item.id,
          isNew: false,
          name: item.name,
          size: item.size,
          maxQuantity: item.quantity,
          quantity: item.quantity,
          purchasePrice: parseFloat(item.purchasePrice),
        },
      ]);
    },
    [],
  );

  const handleAddNew = useCallback(() => {
    setSelectedItems((prev) => [
      ...prev,
      {
        _id: Math.random().toString(36).slice(2),
        isNew: true,
        name: "",
        size: null,
        maxQuantity: 9999,
        quantity: 1,
        purchasePrice: 0,
      },
    ]);
  }, []);

  const handleUpdateItem = useCallback(
    (id: string, data: Partial<SelectedItem>) => {
      setSelectedItems((prev) =>
        prev.map((i) => (i._id === id ? { ...i, ...data } : i)),
      );
    },
    [],
  );

  const handleRemoveItem = useCallback((id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const handleLockToggle = useCallback(() => {
    setIsLocked((prev) => {
      if (prev) {
        return false;
      }
      setClientPriceTotal(totalPurchase.toFixed(0));
      return true;
    });
  }, [totalPurchase]);

  const handleClientPriceChange = useCallback((value: string) => {
    setClientPriceTotal(value);
    setIsLocked(false);
  }, []);

  async function handlePay() {
    if (!clientId || selectedItems.length === 0) return;

    setIsLoading(true);
    try {
      const items: PayItem[] = selectedItems
        .filter((i) => i.quantity > 0)
        .map((i) => ({
          supplierItemId: i.supplierItemId,
          isNew: i.isNew,
          name: i.name,
          quantity: i.quantity,
          purchasePrice: i.purchasePrice,
        }));

      await paySupplierItems({
        supplierId,
        clientId,
        items,
        clientPriceTotal: parseFloat(clientPriceTotal) || totalPurchase,
      });

      await refreshItems();
      await refreshClients();
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  const selectedIds = selectedItems
    .filter((i) => i.supplierItemId)
    .map((i) => i.supplierItemId ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePay();
          }}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Оплата ({supplierName})</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <ClientSelect value={clientId} onChange={setClientId} />

            <ItemSearch
              supplierId={supplierId}
              clientId={clientId ?? ""}
              disabled={!clientId}
              selectedIds={selectedIds}
              onSelect={handleSelectItem}
              onAddNew={handleAddNew}
            />

            <SelectedItems
              items={selectedItems}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
            />

            <PriceSummary
              total={totalPurchase}
              clientPrice={clientPriceTotal}
              isLocked={isLocked}
              onClientPriceChange={handleClientPriceChange}
              onLockToggle={handleLockToggle}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading || !clientId || selectedItems.length === 0}
            >
              {isLoading ? "Оплата..." : "Оплатить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
