"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { IsLoading } from "@/components/ui/is-loading";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { LengthZero } from "@/components/ui/length-zero";
import {
  addSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "@/server/settings";

interface Supplier {
  id: string;
  name: string;
  location: string | null;
}

export function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  function handleAdd() {
    setEditData(null);
    setName("");
    setLocation("");
    setFormOpen(true);
  }

  function handleEdit(supplier: Supplier) {
    // Берём данные из уже загруженного списка, без повторного запроса
    setEditData(supplier);
    setName(supplier.name);
    setLocation(supplier.location || "");
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditData(null);
    setName("");
    setLocation("");
  }

  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (editData) {
        await updateSupplier(editData.id, name.trim(), location.trim() || null);
      } else {
        await addSupplier(name.trim(), location.trim() || null);
      }
      handleClose();
      await loadSuppliers();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteSupplier(deleteId);
    setDeleteId(null);
    await loadSuppliers();
  }

  return (
    <>
      {/* Кнопка добавления */}
      <Button onClick={handleAdd} className="w-full">
        <Plus />
        Поставщик
      </Button>

      {/* Список */}
      {isLoading ? (
        <IsLoading />
      ) : suppliers.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-2">
          {suppliers.map((supplier) => (
            <Item key={supplier.id} variant="outline" size="xs">
              <ItemContent>
                <ItemTitle className="font-semibold">{supplier.name}</ItemTitle>
                <ItemDescription>
                  {supplier.location && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {supplier.location}
                    </span>
                  )}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(supplier)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(supplier.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </div>
      )}

      {/* Модалка добавления/редактирования */}
      <Dialog open={formOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>
                {editData ? "Редактировать поставщика" : "Новый поставщик"}
              </DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="supplier-name">
                  Название <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="supplier-name"
                  name="name"
                  placeholder="Поставщик"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Label htmlFor="supplier-location">Местоположение</Label>
                <Input
                  id="supplier-location"
                  name="location"
                  placeholder="Север-2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={isSaving || !name.trim()}>
                {isSaving
                  ? "Сохранение..."
                  : editData
                    ? "Сохранить"
                    : "Добавить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Подтверждение удаления */}
      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить поставщика?"
        description="Это действие нельзя отменить."
      />
    </>
  );
}
