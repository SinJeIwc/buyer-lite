"use client";

import { Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

interface OrderItem {
  id: string;
  name: string | null;
  quantity: number;
  purchasePrice: string;
  clientPrice: string;
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
    <Item variant="outline" size="xs">
      <ItemContent className="p-4">
        <ItemTitle className="font-medium">
          {clientName || "Без имени"}
        </ItemTitle>
        <ItemDescription>
          <span className="block space-y-1">
            <span className="text-sm text-muted-foreground">
              {supplierName || "Без поставщика"} • {itemsCount} шт
            </span>
            {items.length > 0 && (
              <span className="block space-y-0.5">
                {items.slice(0, 2).map((item) => (
                  <span
                    key={item.id}
                    className="flex justify-between text-sm text-muted-foreground"
                  >
                    <span>
                      {item.name || "Товар"} × {item.quantity}
                    </span>
                    <span>
                      {(
                        parseFloat(item.clientPrice) * item.quantity
                      ).toLocaleString("ru-RU")}{" "}
                      с
                    </span>
                  </span>
                ))}
                {items.length > 2 && (
                  <span className="text-sm text-muted-foreground">
                    и ещё {items.length - 2} товаров...
                  </span>
                )}
              </span>
            )}
            <span className="flex items-center justify-between pt-2 border-t mt-2">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <span className="font-medium">
                {totalClient.toLocaleString("ru-RU")} с
              </span>
            </span>
          </span>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
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
      </ItemActions>
    </Item>
  );
}
