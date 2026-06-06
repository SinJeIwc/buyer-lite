"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SelectedItem } from "./selected-items";

interface ExistingItemCardProps {
  item: SelectedItem;
  onUpdate: (id: string, data: Partial<SelectedItem>) => void;
  onRemove: (id: string) => void;
}

export function ExistingItemCard({
  item,
  onUpdate,
  onRemove,
}: ExistingItemCardProps) {
  return (
    <div className="p-2 bg-muted/50 rounded-lg space-y-2">
      <Field>
        <FieldLabel className="text-xs flex items-center justify-between">
          <span className="truncate">
            {item.name}
            {item.size && (
              <span className="text-muted-foreground ml-1">({item.size})</span>
            )}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive shrink-0"
            onClick={() => onRemove(item._id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </FieldLabel>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field>
          <FieldLabel className="text-xs">Количество</FieldLabel>
          <Input
            type="number"
            min="1"
            max={item.maxQuantity}
            value={item.quantity || ""}
            placeholder="0"
            onChange={(e) =>
              onUpdate(item._id, {
                quantity: Math.min(
                  parseInt(e.target.value, 10) || 0,
                  item.maxQuantity,
                ),
              })
            }
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs">Цена/шт</FieldLabel>
          <Input
            type="number"
            step="0.01"
            value={item.purchasePrice || ""}
            placeholder="0"
            onChange={(e) =>
              onUpdate(item._id, {
                purchasePrice: parseFloat(e.target.value) || 0,
              })
            }
          />
        </Field>
      </div>
    </div>
  );
}
