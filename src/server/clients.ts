"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export interface ClientFormData {
  name: string;
  phone: string;
  city: string;
  notes: string;
}

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

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
  isFavorite: boolean;
  isBlocked: boolean;
  balance: string;
}

export async function getClients(): Promise<Client[]> {
  const userId = await getCurrentUserId();

  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      city: clients.city,
      notes: clients.notes,
      isFavorite: clients.isFavorite,
      isBlocked: clients.isBlocked,
      balance: clients.balance,
    })
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(clients.name);

  // Сортировка: избранные первыми, заблокированные последними
  return rows.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    if (a.isBlocked && !b.isBlocked) return 1;
    if (!a.isBlocked && b.isBlocked) return -1;
    return 0;
  });
}

export async function getClient(id: string) {
  const userId = await getCurrentUserId();

  const [client] = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      city: clients.city,
      notes: clients.notes,
    })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));

  return client;
}

export async function addClient(data: ClientFormData) {
  const userId = await getCurrentUserId();

  const [client] = await db
    .insert(clients)
    .values({
      userId,
      name: data.name,
      phone: data.phone || null,
      city: data.city || null,
      notes: data.notes || null,
    })
    .returning();
  revalidatePath("/clients");
  return client;
}

export async function updateClient(id: string, data: ClientFormData) {
  const userId = await getCurrentUserId();

  await db
    .update(clients)
    .set({
      name: data.name,
      phone: data.phone || null,
      city: data.city || null,
      notes: data.notes || null,
    })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
  revalidatePath("/clients");
}

export async function deleteClient(id: string) {
  const userId = await getCurrentUserId();

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
  revalidatePath("/clients");
}

export async function toggleFavorite(id: string) {
  const userId = await getCurrentUserId();

  const [client] = await db
    .select({ isFavorite: clients.isFavorite })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));

  if (!client) throw new Error("Клиент не найден");

  await db
    .update(clients)
    .set({ isFavorite: !client.isFavorite })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
  revalidatePath("/clients");
}

export async function toggleBlocked(id: string) {
  const userId = await getCurrentUserId();

  const [client] = await db
    .select({ isBlocked: clients.isBlocked })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));

  if (!client) throw new Error("Клиент не найден");

  await db
    .update(clients)
    .set({ isBlocked: !client.isBlocked })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
  revalidatePath("/clients");
}
