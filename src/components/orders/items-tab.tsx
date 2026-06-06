"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { IsLoading } from "@/components/ui/is-loading";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { LengthZero } from "@/components/ui/length-zero";
import { deleteSupplierItem } from "@/server/supplier-items";
import { useItemsStore } from "@/stores/items-store";
import { useSuppliersStore } from "@/stores/suppliers-store";
import { ClientChips } from "./client-chips";
import { EditItemDialog } from "./edit-item-dialog";

interface SupplierItem {
  id: string;
  supplierId: string;
  clientId: string;
  clientName: string | null;
  name: string;
  size: string | null;
  quantity: number;
  purchasePrice: string;
}

export function ItemsTab() {
  const items = useItemsStore((s) => s.items);
  const isLoading = useItemsStore((s) => s.isLoading);
  const refreshItems = useItemsStore((s) => s.refresh);
  const suppliers = useSuppliersStore((s) => s.items);
  const [editItem, setEditItem] = useState<SupplierItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  // Фильтрация
  const filteredItems = useMemo(() => {
    if (!activeClientId) return items;
    return items.filter((item) => item.clientId === activeClientId);
  }, [items, activeClientId]);

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
      {/* Чипсы клиентов */}
      <ClientChips
        items={items}
        activeClientId={activeClientId}
        onChange={setActiveClientId}
      />

      {/* Список товаров */}
      {isLoading ? (
        <IsLoading />
      ) : filteredItems.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Item key={item.id} variant="outline" size="xs">
              <ItemContent className="p-4 min-w-0">
                <ItemTitle className="truncate">
                  {item.name}
                  {item.size && (
                    <span className="text-muted-foreground ml-1">
                      ({item.size})
                    </span>
                  )}
                </ItemTitle>
                <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
                  <span className="truncate shrink-0 max-w-20">
                    {item.clientName || "—"}
                  </span>
                  <span className="shrink-0">•</span>
                  <span className="truncate shrink-0 max-w-20">
                    {getSupplierName(item.supplierId)}
                  </span>
                  <span className="shrink-0">•</span>
                  <span className="truncate shrink-0">
                    {item.quantity}шт по{" "}
                    {parseFloat(item.purchasePrice).toLocaleString("ru-RU")}с
                  </span>
                </div>
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
