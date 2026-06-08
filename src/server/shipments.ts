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

// ==================== Типы ====================

export interface ShipmentItemData {
  storageItemId: string;
  quantity: number;
}

// ==================== Отправки ====================

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
      commissionAmount: shipments.commissionAmount,
      notes: shipments.notes,
      createdAt: shipments.createdAt,
      shippedAt: shipments.shippedAt,
    })
    .from(shipments)
    .leftJoin(clients, eq(shipments.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(
      desc(status === "shipped" ? shipments.shippedAt : shipments.createdAt),
    );

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
    commissionAmount?: number;
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
  if (data.commissionAmount !== undefined)
    updateData.commissionAmount = data.commissionAmount?.toFixed(2) || null;
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
  }

  // Удаляем товары отправки
  await db.delete(shipmentItems).where(eq(shipmentItems.shipmentId, id));

  // Удаляем отправку
  await db
    .delete(shipments)
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  revalidatePath("/shipments");
}
