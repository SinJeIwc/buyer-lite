"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSupplier, deleteSupplier, getSuppliers } from "@/server/settings";

interface Supplier {
  id: string;
  name: string;
  location: string | null;
}

export function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadSuppliers = useCallback(async () => {
    const data = await getSuppliers();
    setSuppliers(data);
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  async function handleAdd() {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await addSupplier(name.trim(), location.trim() || null);
      setName("");
      setLocation("");
      await loadSuppliers();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить поставщика?")) return;
    await deleteSupplier(id);
    await loadSuppliers();
  }

  return (
    <div className="space-y-4">
      {/* Форма добавления */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="supplier-name" className="sr-only">
            Название
          </Label>
          <Input
            id="supplier-name"
            placeholder="Название точки (напр. Айлин)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="supplier-location" className="sr-only">
            Местоположение
          </Label>
          <Input
            id="supplier-location"
            placeholder="Местоположение (необязательно)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <Button onClick={handleAdd} disabled={isLoading || !name.trim()}>
          +
        </Button>
      </div>

      {/* Список */}
      {suppliers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Пока нет поставщиков
        </p>
      ) : (
        <div className="space-y-2">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div>
                <div className="font-medium">{supplier.name}</div>
                {supplier.location && (
                  <div className="text-sm text-muted-foreground">
                    {supplier.location}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(supplier.id)}
                className="text-destructive hover:text-destructive"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
