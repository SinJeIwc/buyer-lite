"use client";

import { ExistingItemCard } from "./existing-item-card";
import { NewItemCard } from "./new-item-card";

export interface SelectedItem {
  _id: string;
  supplierItemId?: string;
  isNew: boolean;
  name: string;
  size: string | null;
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
