"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients, storageItems, suppliers } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизован");
  return user.id;
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
      supplierName: suppliers.name,
      name: storageItems.name,
      size: storageItems.size,
      quantity: storageItems.quantity,
      purchasePrice: storageItems.purchasePrice,
    })
    .from(storageItems)
    .leftJoin(clients, eq(storageItems.clientId, clients.id))
    .leftJoin(suppliers, eq(storageItems.supplierId, suppliers.id))
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
