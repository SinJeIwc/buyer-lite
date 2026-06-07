"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  clients,
  shipmentItems,
  shipments,
  storageItems,
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

// ==================== Отправки ====================

export interface ShipmentItemData {
  storageItemId: string;
  quantity: number;
}

export async function getShipments(status?: string) {
  const userId = await getCurrentUserId();

  const conditions = [eq(shipments.userId, userId)];
  if (status) conditions.push(eq(shipments.status, status));

  const rows = await db
    .select({
      id: shipments.id,
      code: shipments.code,
      clientId: shipments.clientId,
      clientName: clients.name,
      status: shipments.status,
      destination: shipments.destination,
      shippingCost: shipments.shippingCost,
      notes: shipments.notes,
      createdAt: shipments.createdAt,
      shippedAt: shipments.shippedAt,
    })
    .from(shipments)
    .leftJoin(clients, eq(shipments.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(shipments.createdAt));

  // Загружаем товары для каждой отправки
  const result = [];
  for (const shipment of rows) {
    const items = await db
      .select({
        id: shipmentItems.id,
        storageItemId: shipmentItems.storageItemId,
        quantity: shipmentItems.quantity,
        name: storageItems.name,
        size: storageItems.size,
        purchasePrice: storageItems.purchasePrice,
      })
      .from(shipmentItems)
      .leftJoin(storageItems, eq(shipmentItems.storageItemId, storageItems.id))
      .where(eq(shipmentItems.shipmentId, shipment.id));

    result.push({ ...shipment, items });
  }

  return result;
}

export async function createShipment(data: {
  clientId: string;
  code?: string;
  destination?: string;
  notes?: string;
  items: ShipmentItemData[];
}) {
  const userId = await getCurrentUserId();

  if (data.items.length === 0) throw new Error("Нет товаров для отправки");

  // Создаём отправку
  const [shipment] = await db
    .insert(shipments)
    .values({
      userId,
      clientId: data.clientId,
      code: data.code || null,
      destination: data.destination || null,
      notes: data.notes || null,
      status: "preparing",
    })
    .returning();

  // Добавляем товары и уменьшаем количество на складе
  for (const item of data.items) {
    const [storageItem] = await db
      .select({ id: storageItems.id, quantity: storageItems.quantity })
      .from(storageItems)
      .where(
        and(
          eq(storageItems.id, item.storageItemId),
          eq(storageItems.userId, userId),
        ),
      );

    if (!storageItem) throw new Error("Товар на складе не найден");
    if (item.quantity > storageItem.quantity) {
      throw new Error("Недостаточно товара на складе");
    }

    // Добавляем в отправку
    await db.insert(shipmentItems).values({
      shipmentId: shipment.id,
      storageItemId: item.storageItemId,
      quantity: item.quantity,
    });

    // Уменьшаем количество на складе
    const newQuantity = storageItem.quantity - item.quantity;
    await db
      .update(storageItems)
      .set({ quantity: Math.max(newQuantity, 0), updatedAt: new Date() })
      .where(eq(storageItems.id, storageItem.id));
  }

  revalidatePath("/shipments");
  return shipment;
}

export async function updateShipment(
  id: string,
  data: {
    clientId?: string;
    code?: string;
    status?: string;
    destination?: string;
    shippingCost?: number;
    notes?: string;
  },
) {
  const userId = await getCurrentUserId();

  const updateData: Record<string, unknown> = {};
  if (data.clientId !== undefined) updateData.clientId = data.clientId;
  if (data.code !== undefined) updateData.code = data.code || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.destination !== undefined)
    updateData.destination = data.destination || null;
  if (data.shippingCost !== undefined)
    updateData.shippingCost = data.shippingCost?.toFixed(2) || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  // Если статус shipped и ещё не было shippedAt
  if (data.status === "shipped") {
    const [shipment] = await db
      .select({ shippedAt: shipments.shippedAt })
      .from(shipments)
      .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));
    if (shipment && !shipment.shippedAt) {
      updateData.shippedAt = new Date();
    }
  }

  await db
    .update(shipments)
    .set(updateData)
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  revalidatePath("/shipments");
}

export async function shipShipment(
  id: string,
  data: { code?: string; notes?: string; shippingCost?: number },
) {
  const userId = await getCurrentUserId();

  await db
    .update(shipments)
    .set({
      code: data.code || null,
      notes: data.notes || null,
      shippingCost: data.shippingCost?.toFixed(2) || null,
      status: "shipped",
      shippedAt: new Date(),
    })
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  revalidatePath("/shipments");
}

export async function revertShipmentToPreparing(id: string) {
  const userId = await getCurrentUserId();

  await db
    .update(shipments)
    .set({ status: "preparing", shippedAt: null })
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  revalidatePath("/shipments");
}

export async function addShipmentItem(
  shipmentId: string,
  storageItemId: string,
  quantity: number,
) {
  const userId = await getCurrentUserId();

  const [storageItem] = await db
    .select({ id: storageItems.id, quantity: storageItems.quantity })
    .from(storageItems)
    .where(
      and(eq(storageItems.id, storageItemId), eq(storageItems.userId, userId)),
    );

  if (!storageItem) throw new Error("Товар на складе не найден");
  if (quantity > storageItem.quantity) {
    throw new Error("Недостаточно товара на складе");
  }

  await db.insert(shipmentItems).values({
    shipmentId,
    storageItemId,
    quantity,
  });

  const newQuantity = storageItem.quantity - quantity;
  await db
    .update(storageItems)
    .set({ quantity: Math.max(newQuantity, 0), updatedAt: new Date() })
    .where(eq(storageItems.id, storageItem.id));

  revalidatePath("/shipments");
}

export async function removeShipmentItem(shipmentItemId: string) {
  const userId = await getCurrentUserId();

  // Получаем данные товара отправки
  const [shipmentItem] = await db
    .select({
      id: shipmentItems.id,
      storageItemId: shipmentItems.storageItemId,
      quantity: shipmentItems.quantity,
      shipmentId: shipmentItems.shipmentId,
    })
    .from(shipmentItems)
    .where(eq(shipmentItems.id, shipmentItemId));

  if (!shipmentItem) throw new Error("Товар отправки не найден");

  // Проверяем принадлежность отправки пользователю
  const [shipment] = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(
      and(
        eq(shipments.id, shipmentItem.shipmentId),
        eq(shipments.userId, userId),
      ),
    );

  if (!shipment) throw new Error("Отправка не найдена");

  // Возвращаем товар на склад
  const [existing] = await db
    .select({ id: storageItems.id, quantity: storageItems.quantity })
    .from(storageItems)
    .where(eq(storageItems.id, shipmentItem.storageItemId));

  if (existing) {
    await db
      .update(storageItems)
      .set({
        quantity: existing.quantity + shipmentItem.quantity,
        updatedAt: new Date(),
      })
      .where(eq(storageItems.id, existing.id));
  }

  // Удаляем товар из отправки
  await db.delete(shipmentItems).where(eq(shipmentItems.id, shipmentItemId));

  revalidatePath("/shipments");
}

export async function updateShipmentItemQuantity(
  shipmentItemId: string,
  newQuantity: number,
) {
  const userId = await getCurrentUserId();

  const [shipmentItem] = await db
    .select({
      id: shipmentItems.id,
      storageItemId: shipmentItems.storageItemId,
      quantity: shipmentItems.quantity,
      shipmentId: shipmentItems.shipmentId,
    })
    .from(shipmentItems)
    .where(eq(shipmentItems.id, shipmentItemId));

  if (!shipmentItem) throw new Error("Товар отправки не найден");

  const [shipment] = await db
    .select({ id: shipments.id })
    .from(shipments)
    .where(
      and(
        eq(shipments.id, shipmentItem.shipmentId),
        eq(shipments.userId, userId),
      ),
    );

  if (!shipment) throw new Error("Отправка не найдена");

  const diff = shipmentItem.quantity - newQuantity;

  if (diff > 0) {
    // Уменьшили количество — возвращаем разницу на склад
    const [existing] = await db
      .select({ id: storageItems.id, quantity: storageItems.quantity })
      .from(storageItems)
      .where(eq(storageItems.id, shipmentItem.storageItemId));

    if (existing) {
      await db
        .update(storageItems)
        .set({
          quantity: existing.quantity + diff,
          updatedAt: new Date(),
        })
        .where(eq(storageItems.id, existing.id));
    }
  } else if (diff < 0) {
    // Увеличили количество — забираем со склада
    const needed = Math.abs(diff);
    const [existing] = await db
      .select({ id: storageItems.id, quantity: storageItems.quantity })
      .from(storageItems)
      .where(eq(storageItems.id, shipmentItem.storageItemId));

    if (!existing || existing.quantity < needed) {
      throw new Error("Недостаточно товара на складе");
    }

    await db
      .update(storageItems)
      .set({
        quantity: existing.quantity - needed,
        updatedAt: new Date(),
      })
      .where(eq(storageItems.id, existing.id));
  }

  await db
    .update(shipmentItems)
    .set({ quantity: newQuantity })
    .where(eq(shipmentItems.id, shipmentItemId));

  revalidatePath("/shipments");
}

export async function deleteShipment(id: string) {
  const userId = await getCurrentUserId();

  // Возвращаем товары на склад
  const items = await db
    .select({
      storageItemId: shipmentItems.storageItemId,
      quantity: shipmentItems.quantity,
    })
    .from(shipmentItems)
    .where(eq(shipmentItems.shipmentId, id));

  for (const item of items) {
    const [existing] = await db
      .select({ id: storageItems.id, quantity: storageItems.quantity })
      .from(storageItems)
      .where(eq(storageItems.id, item.storageItemId));

    if (existing) {
      await db
        .update(storageItems)
        .set({
          quantity: existing.quantity + item.quantity,
          updatedAt: new Date(),
        })
        .where(eq(storageItems.id, existing.id));
    }
    // Если товар был удалён со склада — восстановить не получится
  }

  // Удаляем товары отправки
  await db.delete(shipmentItems).where(eq(shipmentItems.shipmentId, id));

  // Удаляем отправку
  await db
    .delete(shipments)
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  revalidatePath("/shipments");
}

export async function updateStorageItem(
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
    .update(storageItems)
    .set(updateData)
    .where(and(eq(storageItems.id, id), eq(storageItems.userId, userId)));

  revalidatePath("/shipments");
}
