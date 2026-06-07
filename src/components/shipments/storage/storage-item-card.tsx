"use client";

import { Check, Minus, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import type { StorageItem } from "@/stores/storage-store";
import type { CartItem } from "./storage-tab";

interface StorageItemCardProps {
  item: StorageItem;
  cartItem: CartItem | undefined;
  onToggle: (item: StorageItem) => void;
  onEdit: (item: StorageItem) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

export function StorageItemCard({
  item,
  cartItem,
  onToggle,
  onEdit,
  onUpdateQuantity,
}: StorageItemCardProps) {
  const isSelected = !!cartItem;

  return (
    <div>
      <Item
        variant="outline"
        size="xs"
        className={cn(
          "transition-colors cursor-pointer",
          isSelected && "border-primary bg-primary/5",
        )}
        onClick={() => onToggle(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(item);
          }
        }}
      >
        <ItemContent className="min-w-0">
          <ItemTitle className="truncate flex items-center gap-2">
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
          </ItemTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden ml-7">
            <span className="truncate shrink-0 max-w-20">
              {item.clientName || "—"}
            </span>
            <span className="shrink-0">•</span>
            <span className="truncate shrink-0 max-w-20">
              {item.supplierName || "—"}
            </span>
            <span className="shrink-0">•</span>
            <span className="shrink-0">{item.quantity}шт</span>
            <span className="shrink-0">•</span>
            <span className="shrink-0">
              {parseFloat(item.purchasePrice).toLocaleString("ru-RU")}с
            </span>
          </div>
        </ItemContent>
        <ItemActions>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Pencil className="size-4" />
          </Button>
        </ItemActions>
      </Item>

      {isSelected && (
        <div className="flex items-center justify-end gap-1 mt-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onUpdateQuantity(item.id, cartItem.quantity - 1)}
            disabled={cartItem.quantity <= 1}
          >
            <Minus className="size-3" />
          </Button>
          <Input
            type="number"
            min={1}
            max={cartItem.maxQuantity}
            value={cartItem.quantity}
            className="w-12 h-7 text-center text-sm"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) onUpdateQuantity(item.id, val);
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onUpdateQuantity(item.id, cartItem.quantity + 1)}
            disabled={cartItem.quantity >= cartItem.maxQuantity}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
