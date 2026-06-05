"use client";

import { MapPin, Pencil, PhoneIcon, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { IsLoading } from "@/components/ui/is-loading";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { LengthZero } from "@/components/ui/length-zero";
import { deleteClient, getClients } from "@/server/clients";
import { BalanceButton } from "./balance/balance-button";
import { ClientFormDialog } from "./client-form-dialog";

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
  const [editClient, setEditClient] = useState<Client | null>(null);
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

  function handleEdit(client: Client) {
    setEditClient(client);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditClient(null);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditClient(null);
  }

  function formatBalance(balance: string) {
    const num = parseFloat(balance);
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 0 });
  }

  return (
    <>
      {/* Кнопка добавления */}
      <Button onClick={handleAdd} className="w-full">
        <Plus />
        Клиент
      </Button>

      {/* Список клиентов */}
      {isLoading ? (
        <IsLoading />
      ) : clients.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Item key={client.id} variant="outline" size="xs">
              <ItemContent>
                <ItemTitle className="font-semibold">{client.name}</ItemTitle>
                <ItemDescription>
                  {client.phone && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <PhoneIcon className="w-3 h-3" />
                      {client.phone}
                    </span>
                  )}
                  {client.city && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {client.city}
                    </span>
                  )}
                  {client.notes}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                {/*<BalanceButton clientId={client.id} onSuccess={loadClients} />*/}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(client)}
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
              </ItemActions>
              <ItemSeparator />
              <ItemFooter>
                <span className="text-sm text-muted-foreground">Баланс</span>
                <span
                  className={`font-medium ${
                    parseFloat(client.balance) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatBalance(client.balance)} с
                </span>
                <BalanceButton clientId={client.id} onSuccess={loadClients} />
              </ItemFooter>
            </Item>
          ))}
        </div>
      )}

      {/* Модалка добавления/редактирования */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        client={editClient}
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
    </>
  );
}
