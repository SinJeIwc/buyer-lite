"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SelectedItem {
  _id: string;
  supplierItemId?: string;
  isNew: boolean;
  name: string;
  maxQuantity: number;
  quantity: number;
  purchasePrice: number;
}

interface SelectedItemsProps {
  items: SelectedItem[];
  onUpdate: (id: string, data: Partial<SelectedItem>) => void;
  onRemove: (id: string) => void;
}

export function SelectedItems({
  items,
  onUpdate,
  onRemove,
}: SelectedItemsProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item._id} className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {item.isNew ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Название товара"
                    value={item.name}
                    onChange={(e) =>
                      onUpdate(item._id, { name: e.target.value })
                    }
                    className="h-7 text-sm flex-1 min-w-0"
                  />
                  <Badge variant="secondary" className="shrink-0">
                    Новый
                  </Badge>
                </div>
              ) : (
                <span className="text-sm font-medium truncate block">
                  {item.name}
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive shrink-0"
              onClick={() => onRemove(item._id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Кол-во</Label>
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
                className="h-7 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Цена/шт</Label>
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
                className="h-7 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Сумма</Label>
              <div className="h-7 flex items-center text-sm truncate">
                {(item.purchasePrice * item.quantity).toLocaleString("ru-RU")} с
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
