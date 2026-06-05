"use client";

import { MapPin, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { IsLoading } from "@/components/ui/is-loading";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { LengthZero } from "@/components/ui/length-zero";
import { deleteSupplier } from "@/server/settings";
import { useSuppliersStore } from "@/stores/suppliers-store";
import { SupplierFormDialog } from "./supplier-form-dialog";

interface Supplier {
  id: string;
  name: string;
  location: string | null;
}

export function SuppliersList() {
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const isLoading = useSuppliersStore((s) => s.isLoading);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);
  const refresh = useSuppliersStore((s) => s.refresh);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  function handleAdd() {
    setEditData(null);
    setFormOpen(true);
  }

  function handleEdit(supplier: Supplier) {
    setEditData(supplier);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditData(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteSupplier(deleteId);
    setDeleteId(null);
    await refresh();
  }

  return (
    <>
      {/* Кнопки */}
      <div className="flex gap-2">
        <Button onClick={handleAdd} className="flex-1">
          <Plus className="w-4 h-4 mr-1" />
          Поставщик
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Список */}
      {isLoading ? (
        <IsLoading />
      ) : suppliers.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-2">
          {suppliers.map((supplier) => (
            <Item key={supplier.id} variant="outline" size="xs">
              <ItemContent className="p-4">
                <ItemTitle className="font-medium">{supplier.name}</ItemTitle>
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
      <SupplierFormDialog
        open={formOpen}
        onOpenChange={handleClose}
        supplier={editData}
        onSuccess={() => refresh()}
      />

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
