"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  balanceTransactions,
  clients,
  storageItems,
  supplierItems,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизован");
  return user.id;
}

// ==================== Товары поставщика ====================

export async function getSupplierItems(supplierId?: string) {
  const userId = await getCurrentUserId();

  const query = db
    .select({
      id: supplierItems.id,
      supplierId: supplierItems.supplierId,
      clientId: supplierItems.clientId,
      clientName: clients.name,
      name: supplierItems.name,
      size: supplierItems.size,
      quantity: supplierItems.quantity,
      purchasePrice: supplierItems.purchasePrice,
      createdAt: supplierItems.createdAt,
    })
    .from(supplierItems)
    .leftJoin(clients, eq(supplierItems.clientId, clients.id))
    .where(
      supplierId
        ? and(
            eq(supplierItems.userId, userId),
            eq(supplierItems.supplierId, supplierId),
          )
        : eq(supplierItems.userId, userId),
    )
    .orderBy(desc(supplierItems.updatedAt));

  return await query;
}

export async function getAllSupplierItemsGrouped() {
  const userId = await getCurrentUserId();

  const items = await db
    .select({
      id: supplierItems.id,
      supplierId: supplierItems.supplierId,
      name: supplierItems.name,
      quantity: supplierItems.quantity,
      purchasePrice: supplierItems.purchasePrice,
    })
    .from(supplierItems)
    .where(eq(supplierItems.userId, userId))
    .orderBy(desc(supplierItems.updatedAt));

  // Группируем по поставщику
  const grouped: Record<
    string,
    { id: string; name: string; quantity: number; purchasePrice: string }[]
  > = {};
  for (const item of items) {
    if (!grouped[item.supplierId]) {
      grouped[item.supplierId] = [];
    }
    grouped[item.supplierId].push({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
    });
  }

  return grouped;
}

export async function createSupplierItem(data: {
  clientId: string;
  supplierId: string;
  name: string;
  size?: string;
  quantity: number;
  purchasePrice: number;
}) {
  const userId = await getCurrentUserId();

  await db.insert(supplierItems).values({
    userId,
    clientId: data.clientId,
    supplierId: data.supplierId,
    name: data.name,
    size: data.size || null,
    quantity: data.quantity,
    purchasePrice: data.purchasePrice.toFixed(2),
  });

  revalidatePath("/orders");
}

export async function updateSupplierItem(
  id: string,
  data: {
    clientId?: string;
    name?: string;
    size?: string;
    quantity?: number;
    purchasePrice?: number;
  },
) {
  const userId = await getCurrentUserId();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.clientId !== undefined) updateData.clientId = data.clientId;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.size !== undefined) updateData.size = data.size || null;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.purchasePrice !== undefined)
    updateData.purchasePrice = data.purchasePrice.toFixed(2);

  await db
    .update(supplierItems)
    .set(updateData)
    .where(and(eq(supplierItems.id, id), eq(supplierItems.userId, userId)));

  revalidatePath("/orders");
}

export async function deleteSupplierItem(id: string) {
  const userId = await getCurrentUserId();

  await db
    .delete(supplierItems)
    .where(and(eq(supplierItems.id, id), eq(supplierItems.userId, userId)));

  revalidatePath("/orders");
}

// ==================== Оплата ====================

export interface PayItem {
  supplierItemId?: string; // Если существующий товар
  isNew?: boolean; // Если новый товар
  name?: string; // Для нового товара
  size?: string; // Для нового товара
  quantity: number;
  purchasePrice?: number; // Для нового товара
}

export async function paySupplierItems(data: {
  supplierId: string;
  clientId: string;
  items: PayItem[];
  clientPriceTotal: number;
}) {
  const userId = await getCurrentUserId();

  // Проверяем клиента
  const [client] = await db
    .select({ id: clients.id, balance: clients.balance })
    .from(clients)
    .where(and(eq(clients.id, data.clientId), eq(clients.userId, userId)));

  if (!client) throw new Error("Клиент не найден");

  // Считаем общую сумму закупки (для информации)
  let _totalPurchase = 0;

  for (const item of data.items) {
    if (item.isNew && item.name) {
      // Новый товар — сразу в storage
      _totalPurchase += (item.purchasePrice || 0) * item.quantity;

      // Ищем существующий на складе
      const [existing] = await db
        .select({ id: storageItems.id, quantity: storageItems.quantity })
        .from(storageItems)
        .where(
          and(
            eq(storageItems.userId, userId),
            eq(storageItems.clientId, data.clientId),
            eq(storageItems.supplierId, data.supplierId),
            eq(storageItems.name, item.name),
          ),
        );

      if (existing) {
        await db
          .update(storageItems)
          .set({
            quantity: existing.quantity + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(storageItems.id, existing.id));
      } else {
        await db.insert(storageItems).values({
          userId,
          clientId: data.clientId,
          supplierId: data.supplierId,
          name: item.name,
          size: item.size || null,
          quantity: item.quantity,
        });
      }
    } else if (item.supplierItemId) {
      // Существующий товар
      const [supplierItem] = await db
        .select()
        .from(supplierItems)
        .where(
          and(
            eq(supplierItems.id, item.supplierItemId),
            eq(supplierItems.userId, userId),
          ),
        );

      if (!supplierItem) throw new Error("Товар не найден");

      _totalPurchase += parseFloat(supplierItem.purchasePrice) * item.quantity;

      // Уменьшаем количество в supplier_items
      const newQuantity = supplierItem.quantity - item.quantity;
      if (newQuantity <= 0) {
        await db
          .delete(supplierItems)
          .where(eq(supplierItems.id, supplierItem.id));
      } else {
        await db
          .update(supplierItems)
          .set({ quantity: newQuantity, updatedAt: new Date() })
          .where(eq(supplierItems.id, supplierItem.id));
      }

      // Добавляем в storage
      const [existing] = await db
        .select({ id: storageItems.id, quantity: storageItems.quantity })
        .from(storageItems)
        .where(
          and(
            eq(storageItems.userId, userId),
            eq(storageItems.clientId, data.clientId),
            eq(storageItems.supplierId, data.supplierId),
            eq(storageItems.name, supplierItem.name),
          ),
        );

      if (existing) {
        await db
          .update(storageItems)
          .set({
            quantity: existing.quantity + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(storageItems.id, existing.id));
      } else {
        await db.insert(storageItems).values({
          userId,
          clientId: data.clientId,
          supplierId: data.supplierId,
          name: supplierItem.name,
          size: supplierItem.size,
          quantity: item.quantity,
        });
      }
    }
  }

  // Списываем с баланса клиента
  const clientPrice = data.clientPriceTotal;
  await db
    .update(clients)
    .set({
      balance: sql`${clients.balance} - ${clientPrice.toFixed(2)}`,
    })
    .where(eq(clients.id, data.clientId));

  // Записываем операцию
  await db.insert(balanceTransactions).values({
    clientId: data.clientId,
    type: "order",
    amount: (-clientPrice).toFixed(2),
    description: `Оплата товаров (${data.items.length} позиций)`,
  });

  revalidatePath("/orders");
  revalidatePath("/clients");
}

// ==================== Склад ====================

export async function getStorageItems(clientId?: string) {
  const userId = await getCurrentUserId();

  const query = db
    .select({
      id: storageItems.id,
      clientId: storageItems.clientId,
      clientName: clients.name,
      supplierId: storageItems.supplierId,
      name: storageItems.name,
      size: storageItems.size,
      quantity: storageItems.quantity,
    })
    .from(storageItems)
    .leftJoin(clients, eq(storageItems.clientId, clients.id))
    .where(
      clientId
        ? and(
            eq(storageItems.userId, userId),
            eq(storageItems.clientId, clientId),
          )
        : eq(storageItems.userId, userId),
    )
    .orderBy(desc(storageItems.updatedAt));

  return await query;
}
