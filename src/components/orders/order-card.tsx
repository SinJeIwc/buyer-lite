"use client";

import { Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  itemTypeName: string | null;
  quantity: number;
  purchasePrice: string;
  clientPrice: string;
  name: string | null;
}

interface OrderCardProps {
  id: string;
  clientName: string | null;
  supplierName: string | null;
  status: string;
  items: OrderItem[];
  itemsCount: number;
  totalClient: number;
  onDelete: (id: string) => void;
  onShip: (id: string) => void;
}

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  planned: { label: "Запланирован", variant: "secondary" },
  purchased: { label: "Закуплен", variant: "default" },
  ready: { label: "Получен", variant: "default" },
  shipped: { label: "Отправлен", variant: "outline" },
};

export function OrderCard({
  id,
  clientName,
  supplierName,
  status,
  items,
  itemsCount,
  totalClient,
  onDelete,
  onShip,
}: OrderCardProps) {
  const statusInfo = statusLabels[status] || {
    label: status,
    variant: "secondary" as const,
  };

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
      {/* Шапка */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{clientName}</h3>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {supplierName} • {itemsCount} шт
          </p>
        </div>
        <div className="flex items-center gap-1">
          {status === "ready" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-600"
              onClick={() => onShip(id)}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Товары */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.itemTypeName || item.name} × {item.quantity}
              </span>
              <span>
                {(parseFloat(item.clientPrice) * item.quantity).toLocaleString(
                  "ru-RU",
                )}{" "}
                с
              </span>
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-sm text-muted-foreground">
              и ещё {items.length - 3} товаров...
            </p>
          )}
        </div>
      )}

      {/* Итого */}
      <div className="pt-2 border-t flex justify-between text-sm">
        <span className="text-muted-foreground">Итого для клиента:</span>
        <span className="font-medium">
          {totalClient.toLocaleString("ru-RU")} с
        </span>
      </div>
    </div>
  );
}
