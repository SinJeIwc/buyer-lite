"use client";

import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useItemsStore } from "@/stores/items-store";

interface StoreItem {
  id: string;
  clientId: string;
  name: string;
  size: string | null;
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
  const [isOpen, setIsOpen] = useState(false);

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

  function handleSelectAll() {
    for (const item of filteredItems) {
      onSelect(item);
    }
    setQuery("");
    setIsOpen(false);
  }

  function handleFocus() {
    setIsOpen(true);
  }

  function handleBlur() {
    // Небольшая задержка чтобы клик успел сработать
    setTimeout(() => setIsOpen(false), 200);
  }

  return (
    <div className="space-y-2 relative">
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
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled || !hasItems}
          className="pl-9 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isOpen && filteredItems.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 border rounded-lg max-h-40 overflow-y-auto z-50 bg-popover shadow-md">
            {filteredItems.length > 1 && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-primary/10 text-sm font-medium text-primary border-b"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSelectAll}
              >
                Выбрать все ({filteredItems.length})
              </button>
            )}
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
              >
                <div className="truncate">
                  <span>{item.name}</span>
                  {item.size && (
                    <span className="text-muted-foreground ml-1">
                      ({item.size})
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {item.quantity}шт
                </span>
              </button>
            ))}
          </div>
        )}

        {isOpen && filteredItems.length === 0 && query && (
          <div className="absolute left-0 right-0 top-full mt-1 border rounded-lg z-50 bg-popover shadow-md">
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Товары не найдены
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
