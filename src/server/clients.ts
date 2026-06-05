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

export async function getClients() {
  const userId = await getCurrentUserId();

  return await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      city: clients.city,
      notes: clients.notes,
    })
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(clients.name);
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

  await db.insert(clients).values({
    userId,
    name: data.name,
    phone: data.phone || null,
    city: data.city || null,
    notes: data.notes || null,
  });
  revalidatePath("/clients");
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
