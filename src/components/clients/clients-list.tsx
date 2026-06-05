"use client";

import { MapPin, Pencil, Phone, PlusIcon, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteClient, getClients } from "@/server/clients";
import { Spinner } from "../ui/spinner";
import { ClientFormDialog } from "./client-form-dialog";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
}

export function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function handleDelete() {
    if (!deleteId) return;
    await deleteClient(deleteId);
    setDeleteId(null);
    await loadClients();
  }

  function handleEdit(id: string) {
    setEditId(id);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditId(null);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditId(null);
  }

  return (
    <div className="space-y-4">
      {/* Кнопка добавления */}
      <Button onClick={handleAdd} className="w-full">
        <PlusIcon />
        Добавить
      </Button>

      {/* Список клиентов */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-100">
          <Spinner className="size-8" />
        </div>
      ) : clients.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          Пока нет клиентов
        </p>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <div key={client.id} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 max-w-2/3">
                  <h3 className="font-medium">{client.name}</h3>
                  {client.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {client.phone}
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {client.city}
                    </div>
                  )}
                  {client.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 wrap-break-word  leading-relaxed">
                      {client.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(client.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(client.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка добавления/редактирования */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        clientId={editId}
        onSuccess={loadClients}
      />

      {/* Подтверждение удаления */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все данные клиента будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
