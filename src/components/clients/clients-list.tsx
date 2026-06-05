"use client";

import { MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { deleteClient, getClients } from "@/server/clients";
import { BalanceButton } from "./balance/balance-button";
import { ClientFormDialog } from "./client-form-dialog";
import { LengthZero } from "../ui/length-zero";
import { IsLoading } from "../ui/is-loading";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
  balance: string;
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

  function formatBalance(balance: string) {
    const num = parseFloat(balance);
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 0 });
  }

  return (
    <div className="space-y-4">
      {/* Кнопка добавления */}
      <Button onClick={handleAdd} className="w-full">
        <Plus />
        Поставщик
      </Button>

      {/* Список клиентов */}
      {isLoading ? (
        <IsLoading />
      ) : clients.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {client.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <BalanceButton
                      clientId={client.id}
                      onSuccess={loadClients}
                    />
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
                {/* Баланс */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Баланс
                    </span>
                    <span
                      className={`font-medium ${
                        parseFloat(client.balance) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatBalance(client.balance)} с
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить клиента?"
        description="Все данные клиента будут удалены. Это действие нельзя отменить."
      />
    </div>
  );
}
