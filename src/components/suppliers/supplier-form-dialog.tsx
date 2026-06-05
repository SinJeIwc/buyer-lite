"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSupplier, updateSupplier } from "@/server/settings";

interface Supplier {
  id: string;
  name: string;
  location: string | null;
}

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSuccess: (newSupplier?: { id: string; name: string }) => void;
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: SupplierFormDialogProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!supplier;

  useEffect(() => {
    if (open && supplier) {
      setName(supplier.name);
      setLocation(supplier.location || "");
    } else if (open) {
      setName("");
      setLocation("");
    }
  }, [open, supplier]);

  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (isEditing && supplier) {
        await updateSupplier(supplier.id, name.trim(), location.trim() || null);
        onSuccess();
      } else {
        const result = await addSupplier(name.trim(), location.trim() || null);
        onSuccess(result);
      }
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              {isEditing ? "Редактировать поставщика" : "Новый поставщик"}
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
                placeholder="Айлин"
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
                : isEditing
                  ? "Сохранить"
                  : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
