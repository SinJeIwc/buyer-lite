"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  clients,
  itemTypes,
  orderItems,
  orders,
  suppliers,
} from "@/lib/db/schema";
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
          itemTypeId: orderItems.itemTypeId,
          itemTypeName: itemTypes.name,
          externalId: orderItems.externalId,
          quantity: orderItems.quantity,
          purchasePrice: orderItems.purchasePrice,
          clientPrice: orderItems.clientPrice,
          name: orderItems.name,
        })
        .from(orderItems)
        .leftJoin(itemTypes, eq(orderItems.itemTypeId, itemTypes.id))
        .where(eq(orderItems.orderId, order.id));

      const totalPurchase = items.reduce(
        (sum, item) => sum + parseFloat(item.purchasePrice) * item.quantity,
        0,
      );
      const totalClient = items.reduce(
        (sum, item) => sum + parseFloat(item.clientPrice) * item.quantity,
        0,
      );

      return {
        ...order,
        items,
        totalPurchase,
        totalClient,
        itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      };
    }),
  );

  return ordersWithItems;
}

// ==================== Получить заказ ====================

export async function getOrder(id: string) {
  const userId = await getCurrentUserId();

  const [order] = await db
    .select({
      id: orders.id,
      clientId: orders.clientId,
      supplierId: orders.supplierId,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)));

  if (!order) return null;

  const items = await db
    .select({
      id: orderItems.id,
      itemTypeId: orderItems.itemTypeId,
      itemTypeName: itemTypes.name,
      externalId: orderItems.externalId,
      quantity: orderItems.quantity,
      purchasePrice: orderItems.purchasePrice,
      clientPrice: orderItems.clientPrice,
      name: orderItems.name,
    })
    .from(orderItems)
    .leftJoin(itemTypes, eq(orderItems.itemTypeId, itemTypes.id))
    .where(eq(orderItems.orderId, order.id));

  return { ...order, items };
}

// ==================== Создать заказ ====================

export interface OrderItemData {
  itemTypeId: string;
  externalId?: string;
  quantity: number;
  purchasePrice: number;
  clientPrice: number;
  name?: string;
}

export interface CreateOrderData {
  clientId: string;
  supplierId: string;
  items: OrderItemData[];
}

export async function createOrder(data: CreateOrderData) {
  const userId = await getCurrentUserId();

  // Проверяем что клиент и поставщик принадлежат пользователю
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, data.clientId), eq(clients.userId, userId)));

  if (!client) throw new Error("Клиент не найден");

  // Создаём заказ
  const [order] = await db
    .insert(orders)
    .values({
      clientId: data.clientId,
      supplierId: data.supplierId,
      userId,
      status: "planned",
    })
    .returning();

  // Добавляем товары
  if (data.items.length > 0) {
    await db.insert(orderItems).values(
      data.items.map((item) => ({
        orderId: order.id,
        itemTypeId: item.itemTypeId,
        externalId: item.externalId || null,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice.toFixed(2),
        clientPrice: item.clientPrice.toFixed(2),
        name: item.name || null,
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
