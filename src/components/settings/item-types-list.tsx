"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addItemType, deleteItemType, getItemTypes } from "@/server/settings";

interface ItemType {
  id: string;
  name: string;
}

export function ItemTypesList() {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadItemTypes = useCallback(async () => {
    const data = await getItemTypes();
    setItemTypes(data);
  }, []);

  useEffect(() => {
    loadItemTypes();
  }, [loadItemTypes]);

  async function handleAdd() {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await addItemType(name.trim());
      setName("");
      await loadItemTypes();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить тип товара?")) return;
    await deleteItemType(id);
    await loadItemTypes();
  }

  return (
    <div className="space-y-4">
      {/* Форма добавления */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="item-type-name" className="sr-only">
            Название
          </Label>
          <Input
            id="item-type-name"
            placeholder="Название типа (напр. Блузка)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button onClick={handleAdd} disabled={isLoading || !name.trim()}>
          +
        </Button>
      </div>

      {/* Список */}
      {itemTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Пока нет типов товаров
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {itemTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg"
            >
              <span>{type.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(type.id)}
                className="text-destructive hover:text-destructive/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
