"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BalanceDialog } from "@/components/clients/balance/balance-button";
import { Card, CardContent } from "@/components/ui/card";
import { IsLoading } from "@/components/ui/is-loading";
import { useClientsStore } from "@/stores/clients-store";

export function ClientGrid() {
  const isLoading = useClientsStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.items);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [balanceOpen, setBalanceOpen] = useState(false);

  if (clients.length === 0) return null;

  function handleClientClick(clientId: string) {
    setSelectedClientId(clientId);
    setBalanceOpen(true);
  }

  function formatBalance(balance: string) {
    const num = parseFloat(balance);
    return num.toLocaleString("ru-RU", { minimumFractionDigits: 0 });
  }

  const hasOdd = clients.length % 2 !== 0;

  if (isLoading) return <IsLoading />;

  return (
    <>
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-1.5">
          Клиенты
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => handleClientClick(client.id)}
            >
              <Card className="active:scale-[0.97] transition-transform h-full">
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p
                    className={`text-lg font-semibold tabular-nums ${
                      parseFloat(client.balance) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatBalance(client.balance)}с
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}

          {/* Кнопка "+" если нечётное количество */}
          {hasOdd && (
            <Link href="/clients">
              <Card className="active:scale-[0.97] transition-transform h-full border-dashed">
                <CardContent className="p-3 flex items-center justify-center h-full">
                  <Plus className="size-6 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Модалка пополнения */}
      {selectedClientId && (
        <BalanceDialog
          open={balanceOpen}
          onOpenChange={setBalanceOpen}
          clientId={selectedClientId}
          onSuccess={() => {
            useClientsStore.getState().refresh();
          }}
        />
      )}
    </>
  );
}
