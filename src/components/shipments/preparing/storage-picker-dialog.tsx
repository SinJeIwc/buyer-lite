"use client";

import { Check, ListChecks, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ClientChips } from "@/components/orders/client-chips";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IsLoading } from "@/components/ui/is-loading";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { LengthZero } from "@/components/ui/length-zero";
import { cn } from "@/lib/utils";
import type { StorageItem } from "@/stores/storage-store";
import type { CartItem } from "../types";

interface StoragePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: StorageItem[];
  isLoading: boolean;
  excludeIds: Set<string>;
  onConfirm: (picked: CartItem[]) => void;
}

export function StoragePickerDialog({
  open,
  onOpenChange,
  items,
  isLoading,
  excludeIds,
  onConfirm,
}: StoragePickerDialogProps) {
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  const availableItems = useMemo(
    () => items.filter((i) => !excludeIds.has(i.id)),
    [items, excludeIds],
  );

  const filteredItems = useMemo(() => {
    if (!activeClientId) return availableItems;
    return availableItems.filter((i) => i.clientId === activeClientId);
  }, [availableItems, activeClientId]);

  const filteredInCart = useMemo(() => {
    let count = 0;
    for (const item of filteredItems) {
      if (cart.has(item.id)) count++;
    }
    return count;
  }, [filteredItems, cart]);

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

  function handleConfirm() {
    onConfirm(Array.from(cart.values()));
    setCart(new Map());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Добавить товары</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {availableItems.length > 0 && (
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

          <div className="max-w-[80vw]">
            <ClientChips
              items={availableItems}
              activeClientId={activeClientId}
              onChange={setActiveClientId}
            />
          </div>

          {isLoading ? (
            <IsLoading />
          ) : filteredItems.length === 0 ? (
            <LengthZero />
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredItems.map((item) => {
                const inCart = cart.get(item.id);
                const isSelected = !!inCart;

                return (
                  <div key={item.id}>
                    <Item
                      variant="outline"
                      size="xs"
                      className={cn(
                        "transition-colors cursor-pointer",
                        isSelected && "border-primary bg-primary/5",
                      )}
                      onClick={() => toggleItem(item)}
                    >
                      <ItemContent className="min-w-0">
                        <ItemTitle className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30",
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="truncate">
                            {item.name}
                            {item.size && (
                              <span className="text-muted-foreground ml-1">
                                ({item.size})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {item.quantity}шт
                          </span>
                        </ItemTitle>
                      </ItemContent>
                    </Item>

                    {isSelected && (
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            updateQuantity(item.id, inCart.quantity - 1)
                          }
                          disabled={inCart.quantity <= 1}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={inCart.maxQuantity}
                          value={inCart.quantity}
                          className="w-12 h-7 text-center text-sm"
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!Number.isNaN(val))
                              updateQuantity(item.id, val);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            updateQuantity(item.id, inCart.quantity + 1)
                          }
                          disabled={inCart.quantity >= inCart.maxQuantity}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={cart.size === 0}>
            Добавить ({cart.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
