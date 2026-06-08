"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients, supplierItems } from "@/lib/db/schema";
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
