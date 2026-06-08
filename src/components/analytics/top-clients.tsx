"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopClient } from "@/server/dashboard";

interface TopClientsProps {
  clients: TopClient[];
}

export function TopClients({ clients }: TopClientsProps) {
  if (clients.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Топ клиентов (месяц)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {clients.map((client, i) => (
            <div
              key={client.clientId}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                  {i + 1}.
                </span>
                <span className="text-sm truncate">{client.clientName}</span>
              </div>
              <span className="text-sm font-medium tabular-nums text-green-600 shrink-0 ml-2">
                +{client.total.toLocaleString("ru-RU")}с
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
