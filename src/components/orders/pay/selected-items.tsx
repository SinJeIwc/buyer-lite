"use client";

import type { SelectedItem } from "../types";
import { ExistingItemCard } from "./existing-item-card";
import { NewItemCard } from "./new-item-card";

export type { SelectedItem };

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
      {items.map((item) =>
        item.isNew ? (
          <NewItemCard
            key={item._id}
            item={item}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ) : (
          <ExistingItemCard
            key={item._id}
            item={item}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ),
      )}
    </div>
  );
}
