"use client";

import {
  Ban,
  Clock,
  MapPin,
  Pencil,
  PhoneIcon,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";
import { deleteClient, toggleBlocked, toggleFavorite } from "@/server/clients";
import { useClientsStore } from "@/stores/clients-store";
import { BalanceButton } from "./balance/balance-button";
import { ClientFormDialog } from "./client-form-dialog";
import type { ClientBrief } from "./types";

interface Client extends ClientBrief {
  isFavorite: boolean;
  isBlocked: boolean;
  balance: string;
}

export function ClientsList() {
  const clients = useClientsStore((s) => s.items);
  const isLoading = useClientsStore((s) => s.isLoading);
  const fetchClients = useClientsStore((s) => s.fetchItems);
  const refresh = useClientsStore((s) => s.refresh);
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function handleDelete() {
    if (!deleteId) return;
    await deleteClient(deleteId);
    setDeleteId(null);
    await refresh();
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

  async function handleToggleFavorite(id: string) {
    await toggleFavorite(id);
    await refresh();
  }

  async function handleToggleBlocked(id: string) {
    await toggleBlocked(id);
    await refresh();
  }

  return (
    <>
      {/* Кнопки */}
      <div className="flex gap-2">
        <Button onClick={handleAdd} className="flex-1">
          <Plus className="w-4 h-4 mr-1" />
          Клиент
        </Button>
        <Link href="/clients/balance-history">
          <Button variant="outline" size="icon">
            <Clock className="w-4 h-4" />
          </Button>
        </Link>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Список клиентов */}
      {isLoading ? (
        <IsLoading />
      ) : clients.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Item
              key={client.id}
              variant="outline"
              size="xs"
              className={cn(client.isBlocked && "opacity-50")}
            >
              <ItemContent>
                <ItemTitle className="font-semibold flex items-center gap-1.5">
                  {client.name}
                </ItemTitle>
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
              <ItemActions className="grid grid-cols-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggleFavorite(client.id)}
                >
                  <Star
                    className={cn(
                      "w-4 h-4",
                      client.isFavorite
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground",
                    )}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggleBlocked(client.id)}
                >
                  <Ban
                    className={cn(
                      "w-4 h-4",
                      client.isBlocked
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  />
                </Button>
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
                <BalanceButton clientId={client.id} onSuccess={refresh} />
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
        onSuccess={() => refresh()}
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
