"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addClient,
  type ClientFormData,
  getClient,
  updateClient,
} from "@/server/clients";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string | null;
  onSuccess: () => void;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: ClientFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    phone: "",
    city: "",
    notes: "",
  });

  const isEditing = !!clientId;

  const loadClient = useCallback(async (id: string) => {
    setIsLoadingData(true);
    try {
      const client = await getClient(id);
      if (client) {
        setFormData({
          name: client.name,
          phone: client.phone ?? "",
          city: client.city ?? "",
          notes: client.notes ?? "",
        });
      }
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (open && clientId) {
      loadClient(clientId);
    } else if (open) {
      setFormData({ name: "", phone: "", city: "", notes: "" });
    }
  }, [open, clientId, loadClient]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      if (isEditing && clientId) {
        await updateClient(clientId, formData);
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
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Редактировать клиента" : "Новый клиент"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Измените данные клиента"
                : "Заполните данные нового клиента"}
            </DialogDescription>
          </DialogHeader>

          {isLoadingData ? (
            <div className="py-8 text-center text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <FieldGroup className="gap-4">
              <Field className="gap-2">
                <Label htmlFor="client-name">Имя *</Label>
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
              <Field className="gap-2">
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
              <Field className="gap-2">
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
              <Field className="gap-2">
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
          )}

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading || isLoadingData}>
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
