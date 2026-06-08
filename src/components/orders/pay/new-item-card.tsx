"use client";

import { Trash2 } from "lucide-react";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getNameSuggestions, getSizeSuggestions } from "@/lib/item-suggestions";
import type { SelectedItem } from "./selected-items";

interface NewItemCardProps {
  item: SelectedItem;
  onUpdate: (id: string, data: Partial<SelectedItem>) => void;
  onRemove: (id: string) => void;
}

export function NewItemCard({ item, onUpdate, onRemove }: NewItemCardProps) {
  return (
    <div className="p-2 bg-muted/50 rounded-lg space-y-2">
      <Field>
        <FieldLabel className="text-xs flex items-center justify-between">
          <FieldLabel className="text-xs">Название</FieldLabel>
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
        <AutocompleteInput
          value={item.name}
          onChange={(value) => onUpdate(item._id, { name: value })}
          suggestions={getNameSuggestions(item.name)}
          placeholder="Юбка №032"
        />
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <Field>
          <FieldLabel className="text-xs">Размер</FieldLabel>
          <AutocompleteInput
            value={item.size ?? ""}
            onChange={(value) => onUpdate(item._id, { size: value || null })}
            suggestions={getSizeSuggestions(item.size ?? "", item.name)}
            placeholder="32-40, M"
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs">Количество</FieldLabel>
          <Input
            type="number"
            min="1"
            value={item.quantity || ""}
            placeholder="0"
            onChange={(e) =>
              onUpdate(item._id, {
                quantity: parseInt(e.target.value, 10) || 0,
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
