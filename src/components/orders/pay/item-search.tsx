"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useItemsStore } from "@/stores/items-store";

interface StoreItem {
  id: string;
  clientId: string;
  name: string;
  quantity: number;
  purchasePrice: string;
}

interface ItemSearchProps {
  supplierId: string;
  clientId: string;
  disabled: boolean;
  selectedIds: string[];
  onSelect: (item: StoreItem) => void;
  onAddNew: () => void;
}

export function ItemSearch({
  supplierId,
  clientId,
  disabled,
  selectedIds,
  onSelect,
  onAddNew,
}: ItemSearchProps) {
  const storeItems = useItemsStore((s) => s.items);
  const [query, setQuery] = useState("");

  const clientItems = storeItems
    .filter((item) => item.supplierId === supplierId)
    .filter((item) => item.clientId === clientId);

  const hasItems = clientItems.length > 0;

  const filteredItems = clientItems
    .filter(
      (item) => !query || item.name.toLowerCase().includes(query.toLowerCase()),
    )
    .filter((item) => !selectedIds.includes(item.id));

  function handleSelect(item: StoreItem) {
    onSelect(item);
    setQuery("");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Товары</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddNew}
          disabled={disabled}
        >
          <Plus className="w-4 h-4 mr-1" />
          Добавить
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={
            disabled
              ? "Сначала выберите клиента"
              : !hasItems
                ? "У клиента нет товаров"
                : "Поиск товара..."
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled || !hasItems}
          className="pl-9"
        />
      </div>

      {query && filteredItems.length > 0 && (
        <div className="border rounded-lg max-h-40 overflow-y-auto relative z-[200] bg-popover">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
              onClick={() => handleSelect(item)}
            >
              <span className="truncate">{item.name}</span>
              <span className="text-muted-foreground shrink-0 ml-2">
                {item.quantity}шт
              </span>
            </button>
          ))}
        </div>
      )}

      {query && filteredItems.length === 0 && (
        <p className="text-sm text-muted-foreground">Товары не найдены</p>
      )}
    </div>
  );
}
