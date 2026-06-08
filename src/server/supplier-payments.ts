"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  balanceOperations,
  clients,
  orderPaymentItems,
  orderPayments,
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

  // Считаем общую сумму закупки и собираем детали товаров
  let _totalPurchase = 0;
  const _itemDetails: Array<{
    name: string;
    size: string | null;
    quantity: number;
    purchasePrice: number;
  }> = [];

  for (const item of data.items) {
    if (item.isNew && item.name) {
      // Новый товар — сразу в storage
      const price = item.purchasePrice || 0;
      _totalPurchase += price * item.quantity;
      _itemDetails.push({
        name: item.name,
        size: item.size || null,
        quantity: item.quantity,
        purchasePrice: price,
      });

      // Ищем существующий на складе (имя + размер + цена)
      const [existing] = await db
        .select({ id: storageItems.id, quantity: storageItems.quantity })
        .from(storageItems)
        .where(
          and(
            eq(storageItems.userId, userId),
            eq(storageItems.clientId, data.clientId),
            eq(storageItems.supplierId, data.supplierId),
            eq(storageItems.name, item.name),
            eq(storageItems.size, item.size || null),
            eq(
              storageItems.purchasePrice,
              (item.purchasePrice || 0).toFixed(2),
            ),
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
          purchasePrice: (item.purchasePrice || 0).toFixed(2),
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

      const price = parseFloat(supplierItem.purchasePrice);
      _totalPurchase += price * item.quantity;
      _itemDetails.push({
        name: supplierItem.name,
        size: supplierItem.size,
        quantity: item.quantity,
        purchasePrice: price,
      });

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

      // Добавляем в storage (ищем по имени + размеру + цене)
      const [existing] = await db
        .select({ id: storageItems.id, quantity: storageItems.quantity })
        .from(storageItems)
        .where(
          and(
            eq(storageItems.userId, userId),
            eq(storageItems.clientId, data.clientId),
            eq(storageItems.supplierId, data.supplierId),
            eq(storageItems.name, supplierItem.name),
            eq(storageItems.size, supplierItem.size),
            eq(storageItems.purchasePrice, supplierItem.purchasePrice),
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
          purchasePrice: supplierItem.purchasePrice,
        });
      }
    }
  }

  // Списываем с баланса клиента (клиентскую цену)
  const clientPrice = data.clientPriceTotal;
  await db
    .update(clients)
    .set({
      balance: sql`${clients.balance} - ${clientPrice.toFixed(2)}`,
    })
    .where(eq(clients.id, data.clientId));

  // Сохраняем детали оплаты для истории
  const [payment] = await db
    .insert(orderPayments)
    .values({
      userId,
      clientId: data.clientId,
      supplierId: data.supplierId,
      buyerTotal: clientPrice.toFixed(2),
      purchaseTotal: _totalPurchase.toFixed(2),
    })
    .returning();

  // Сохраняем товары оплаты
  if (_itemDetails.length > 0) {
    await db.insert(orderPaymentItems).values(
      _itemDetails.map((item) => ({
        paymentId: payment.id,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice.toFixed(2),
        buyerPrice: item.purchasePrice.toFixed(2),
      })),
    );
  }

  // Записываем операцию в историю баланса
  await db.insert(balanceOperations).values({
    clientId: data.clientId,
    userId,
    type: "order",
    amount: (-clientPrice).toFixed(2),
    description: `Оплата товаров (${data.items.length} позиций)`,
    referenceId: payment.id,
  });

  revalidatePath("/orders");
  revalidatePath("/clients");
}
