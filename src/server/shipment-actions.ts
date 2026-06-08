"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  balanceOperations,
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

// ==================== Отправить ====================

export async function shipShipment(
  id: string,
  data: {
    code?: string;
    notes?: string;
    shippingCost?: number;
    commissionAmount?: number;
  },
) {
  const userId = await getCurrentUserId();

  // Получаем clientId и проверяем принадлежность
  const [shipment] = await db
    .select({
      clientId: shipments.clientId,
      shippingCost: shipments.shippingCost,
    })
    .from(shipments)
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  if (!shipment) throw new Error("Отправка не найдена");

  const commissionAmount = data.commissionAmount ?? 0;

  await db
    .update(shipments)
    .set({
      code: data.code || null,
      notes: data.notes || null,
      shippingCost: data.shippingCost?.toFixed(2) || null,
      commissionAmount:
        commissionAmount > 0 ? commissionAmount.toFixed(2) : null,
      status: "shipped",
      shippedAt: new Date(),
    })
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  // Списываем стоимость доставки с баланса клиента
  const shippingCost = data.shippingCost ?? 0;
  if (shippingCost > 0) {
    await db
      .update(clients)
      .set({
        balance: sql`${clients.balance} - ${shippingCost.toFixed(2)}`,
      })
      .where(eq(clients.id, shipment.clientId));

    await db.insert(balanceOperations).values({
      clientId: shipment.clientId,
      userId,
      type: "shipping",
      amount: (-shippingCost).toFixed(2),
      description: `Доставка${data.code ? ` #${data.code}` : ""}`,
      referenceId: id,
    });
  }

  // Списываем комиссию с баланса клиента
  if (commissionAmount > 0) {
    await db
      .update(clients)
      .set({
        balance: sql`${clients.balance} - ${commissionAmount.toFixed(2)}`,
      })
      .where(eq(clients.id, shipment.clientId));

    await db.insert(balanceOperations).values({
      clientId: shipment.clientId,
      userId,
      type: "commission",
      amount: (-commissionAmount).toFixed(2),
      description: `Комиссия${data.code ? ` #${data.code}` : ""}`,
      referenceId: id,
    });
  }

  revalidatePath("/shipments");
}

// ==================== Вернуть в подготовку ====================

export async function revertShipmentToPreparing(id: string) {
  const userId = await getCurrentUserId();

  // Получаем данные отправки до отката
  const [shipment] = await db
    .select({
      clientId: shipments.clientId,
      shippingCost: shipments.shippingCost,
      commissionAmount: shipments.commissionAmount,
      code: shipments.code,
      status: shipments.status,
    })
    .from(shipments)
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  if (!shipment) throw new Error("Отправка не найдена");
  if (shipment.status !== "shipped")
    throw new Error("Отправка уже в статусе подготовки");

  await db
    .update(shipments)
    .set({ status: "preparing", shippedAt: null, commissionAmount: null })
    .where(and(eq(shipments.id, id), eq(shipments.userId, userId)));

  // Возвращаем стоимость доставки на баланс
  const shippingCost = parseFloat(shipment.shippingCost || "0");
  if (shippingCost > 0) {
    await db
      .update(clients)
      .set({
        balance: sql`${clients.balance} + ${shippingCost.toFixed(2)}`,
      })
      .where(eq(clients.id, shipment.clientId));

    await db.insert(balanceOperations).values({
      clientId: shipment.clientId,
      userId,
      type: "shipping",
      amount: shippingCost.toFixed(2),
      description: `Возврат за доставку${shipment.code ? ` #${shipment.code}` : ""}`,
    });
  }

  // Возвращаем комиссию на баланс
  const commissionAmount = parseFloat(shipment.commissionAmount || "0");
  if (commissionAmount > 0) {
    await db
      .update(clients)
      .set({
        balance: sql`${clients.balance} + ${commissionAmount.toFixed(2)}`,
      })
      .where(eq(clients.id, shipment.clientId));

    await db.insert(balanceOperations).values({
      clientId: shipment.clientId,
      userId,
      type: "commission",
      amount: commissionAmount.toFixed(2),
      description: `Возврат комиссии${shipment.code ? ` #${shipment.code}` : ""}`,
    });
  }

  revalidatePath("/shipments");
}

// ==================== Товары отправки ====================

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
