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
import { Textarea } from "@/components/ui/textarea";
import { addClient, type ClientFormData, updateClient } from "@/server/clients";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess: () => void;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    phone: "",
    city: "",
    notes: "",
  });

  const isEditing = !!client;

  // Заполняем форму при открытии (данные уже есть, без запроса)
  useEffect(() => {
    if (open && client) {
      setFormData({
        name: client.name,
        phone: client.phone ?? "",
        city: client.city ?? "",
        notes: client.notes ?? "",
      });
    } else if (open) {
      setFormData({ name: "", phone: "", city: "", notes: "" });
    }
  }, [open, client]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      if (isEditing && client) {
        await updateClient(client.id, formData);
      } else {
        await addClient(formData);
      }
      onOpenChange(false);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Редактировать клиента" : "Новый клиент"}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="client-name">
                Имя <span className="text-red-500">*</span>
              </Label>
              <Input
                id="client-name"
                name="name"
                placeholder="Имя клиента"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </Field>
            <Field>
              <Label htmlFor="client-phone">Номер телефона</Label>
              <Input
                id="client-phone"
                name="phone"
                type="tel"
                placeholder="+7 900 123-45-67"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </Field>
            <Field>
              <Label htmlFor="client-city">Город</Label>
              <Input
                id="client-city"
                name="city"
                placeholder="Москва"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </Field>
            <Field>
              <Label htmlFor="client-notes">Заметки</Label>
              <Textarea
                id="client-notes"
                name="notes"
                placeholder="Дополнительная информация..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading
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
