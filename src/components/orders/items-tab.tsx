"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { IsLoading } from "@/components/ui/is-loading";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { LengthZero } from "@/components/ui/length-zero";
import { deleteSupplierItem } from "@/server/supplier-items";
import { useItemsStore } from "@/stores/items-store";
import { useSuppliersStore } from "@/stores/suppliers-store";
import { EditItemDialog } from "./edit-item-dialog";

interface SupplierItem {
  id: string;
  supplierId: string;
  name: string;
  quantity: number;
  purchasePrice: string;
}

export function ItemsTab() {
  const items = useItemsStore((s) => s.items);
  const isLoading = useItemsStore((s) => s.isLoading);
  const refreshItems = useItemsStore((s) => s.refresh);
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const [editItem, setEditItem] = useState<SupplierItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function getSupplierName(supplierId: string) {
    return suppliers.find((s) => s.id === supplierId)?.name || "—";
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteSupplierItem(deleteId);
    setDeleteId(null);
    await refreshItems();
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <IsLoading />
      ) : items.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Item key={item.id} variant="outline" size="xs">
              <ItemContent className="p-4">
                <ItemTitle>{item.name}</ItemTitle>
                <ItemDescription>
                  <span className="text-sm text-muted-foreground">
                    {getSupplierName(item.supplierId)} • {item.quantity} шт •{" "}
                    {parseFloat(item.purchasePrice).toLocaleString("ru-RU")}{" "}
                    с/шт
                  </span>
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditItem(item)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </div>
      )}

      {editItem && (
        <EditItemDialog
          open={!!editItem}
          onOpenChange={() => setEditItem(null)}
          item={editItem}
          onSuccess={() => refreshItems()}
        />
      )}

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить товар?"
        description="Это действие нельзя отменить."
      />
    </div>
  );
}
