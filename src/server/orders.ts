"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients, orderItems, orders, suppliers } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Не авторизован");
  }

  return user.id;
}

// ==================== Получить заказы ====================

export async function getOrders() {
  const userId = await getCurrentUserId();

  const result = await db
    .select({
      id: orders.id,
      clientId: orders.clientId,
      clientName: clients.name,
      supplierId: orders.supplierId,
      supplierName: suppliers.name,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(suppliers, eq(orders.supplierId, suppliers.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  // Получаем товары для каждого заказа
  const ordersWithItems = await Promise.all(
    result.map(async (order) => {
      const items = await db
        .select({
          id: orderItems.id,
          name: orderItems.name,
          quantity: orderItems.quantity,
          purchasePrice: orderItems.purchasePrice,
          clientPrice: orderItems.clientPrice,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const totalClient = items.reduce(
        (sum, item) => sum + parseFloat(item.clientPrice) * item.quantity,
        0,
      );

      return {
        ...order,
        items,
        totalClient,
        itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    }),
  );

  return ordersWithItems;
}

// ==================== Создать заказ ====================

export interface OrderItemData {
  name: string;
  quantity: number;
  purchasePrice: number;
  clientPrice: number;
}

export interface CreateOrderData {
  clientName: string;
  supplierName: string;
  items: OrderItemData[];
}

export async function createOrder(data: CreateOrderData) {
  const userId = await getCurrentUserId();

  // Ищем или создаём клиента
  let [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.userId, userId), eq(clients.name, data.clientName)));

  if (!client) {
    [client] = await db
      .insert(clients)
      .values({ userId, name: data.clientName })
      .returning();
  }

  // Ищем или создаём поставщика
  let [supplier] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(eq(suppliers.name, data.supplierName));

  if (!supplier) {
    [supplier] = await db
      .insert(suppliers)
      .values({ name: data.supplierName })
      .returning();
  }

  // Создаём заказ
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      clientId: client.id,
      supplierId: supplier.id,
      status: "planned",
    })
    .returning();

  // Добавляем товары
  if (data.items.length > 0) {
    await db.insert(orderItems).values(
      data.items.map((item) => ({
        orderId: order.id,
        name: item.name,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice.toFixed(2),
        clientPrice: item.clientPrice.toFixed(2),
      })),
    );
  }

  revalidatePath("/orders");
  return order.id;
}

// ==================== Обновить статус заказа ====================

export async function updateOrderStatus(
  id: string,
  status: "planned" | "purchased" | "ready" | "shipped",
) {
  const userId = await getCurrentUserId();

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.userId, userId)));

  revalidatePath("/orders");
}

// ==================== Удалить заказ ====================

export async function deleteOrder(id: string) {
  const userId = await getCurrentUserId();

  // Сначала удаляем товары
  await db.delete(orderItems).where(eq(orderItems.orderId, id));

  // Потом сам заказ
  await db
    .delete(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)));

  revalidatePath("/orders");
}
