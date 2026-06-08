"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useClientsStore } from "@/stores/clients-store";

interface ClientChipsProps {
  items: Array<{ clientId: string; clientName: string | null }>;
  activeClientId: string | null;
  onChange: (clientId: string | null) => void;
}

export function ClientChips({
  items,
  activeClientId,
  onChange,
}: ClientChipsProps) {
  const clientsList = useClientsStore((s) => s.items);

  // Уникальные клиенты из товаров, избранные первыми
  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (item.clientId && !map.has(item.clientId)) {
        map.set(item.clientId, item.clientName || "Без имени");
      }
    }
    const list = Array.from(map, ([id, name]) => ({ id, name }));
    return list.sort((a, b) => {
      const aFav = clientsList.find((c) => c.id === a.id)?.isFavorite ? 1 : 0;
      const bFav = clientsList.find((c) => c.id === b.id)?.isFavorite ? 1 : 0;
      return bFav - aFav;
    });
  }, [items, clientsList]);

  if (clients.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none">
      <Button
        variant={!activeClientId ? "default" : "outline"}
        size="sm"
        className="rounded-full shrink-0"
        onClick={() => onChange(null)}
      >
        Все
      </Button>
      {clients.map((client) => (
        <Button
          key={client.id}
          variant={activeClientId === client.id ? "default" : "outline"}
          size="sm"
          className="rounded-full shrink-0 max-w-32"
          onClick={() =>
            onChange(client.id === activeClientId ? null : client.id)
          }
        >
          <span className="truncate">{client.name}</span>
        </Button>
      ))}
    </div>
  );
}
