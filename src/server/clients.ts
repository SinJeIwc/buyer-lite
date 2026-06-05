"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";

export interface ClientFormData {
  name: string;
  phone: string;
  city: string;
  notes: string;
}

export async function getClients() {
  return await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      city: clients.city,
      notes: clients.notes,
    })
    .from(clients)
    .orderBy(clients.name);
}

export async function getClient(id: string) {
  const [client] = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      city: clients.city,
      notes: clients.notes,
    })
    .from(clients)
    .where(eq(clients.id, id));

  return client;
}

export async function addClient(data: ClientFormData) {
  await db.insert(clients).values({
    name: data.name,
    phone: data.phone || null,
    city: data.city || null,
    notes: data.notes || null,
  });
  revalidatePath("/clients");
}

export async function updateClient(id: string, data: ClientFormData) {
  await db
    .update(clients)
    .set({
      name: data.name,
      phone: data.phone || null,
      city: data.city || null,
      notes: data.notes || null,
    })
    .where(eq(clients.id, id));
  revalidatePath("/clients");
}

export async function deleteClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
}
