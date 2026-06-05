"use client";

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
import { Spinner } from "@/components/ui/spinner";
import { deleteOrder, getOrders, updateOrderStatus } from "@/server/orders";
import { OrderCard } from "./order-card";
import { OrderFormDialog } from "./order-form-dialog";

interface OrderItem {
  id: string;
  itemTypeName: string | null;
  quantity: number;
  purchasePrice: string;
  clientPrice: string;
  name: string | null;
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
  totalPurchase: number;
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
    <div className="space-y-4">
      {/* Кнопка добавления */}
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>+ Заказ</Button>
      </div>

      {/* Список заказов */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="w-8 h-8" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Пока нет заказов</p>
          <p className="text-sm text-muted-foreground mt-1">
            Нажмите "+ Заказ" чтобы создать первый
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все товары в заказе будут удалены.
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
