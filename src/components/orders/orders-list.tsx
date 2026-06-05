"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { IsLoading } from "@/components/ui/is-loading";
import { LengthZero } from "@/components/ui/length-zero";
import { deleteOrder, getOrders, updateOrderStatus } from "@/server/orders";
import { OrderCard } from "./order-card";
import { OrderFormDialog } from "./order-form-dialog";

interface OrderItem {
  id: string;
  name: string | null;
  quantity: number;
  purchasePrice: string;
  clientPrice: string;
}

interface Order {
  id: string;
  clientId: string;
  clientName: string | null;
  supplierId: string;
  supplierName: string | null;
  status: string;
  items: OrderItem[];
  itemsCount: number;
  totalClient: number;
  createdAt: Date | null;
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleDelete() {
    if (!deleteId) return;
    await deleteOrder(deleteId);
    setDeleteId(null);
    await loadOrders();
  }

  async function handleShip(id: string) {
    await updateOrderStatus(id, "shipped");
    await loadOrders();
  }

  return (
    <>
      {/* Кнопка добавления */}
      <Button onClick={() => setFormOpen(true)} className="w-full">
        <Plus />
        Заказ
      </Button>

      {/* Список заказов */}
      {isLoading ? (
        <IsLoading />
      ) : orders.length === 0 ? (
        <LengthZero />
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              {...order}
              onDelete={setDeleteId}
              onShip={handleShip}
            />
          ))}
        </div>
      )}

      {/* Модалка создания */}
      <OrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={loadOrders}
      />

      {/* Подтверждение удаления */}
      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Удалить заказ?"
        description="Все товары в заказе будут удалены. Это действие нельзя отменить."
      />
    </>
  );
}
