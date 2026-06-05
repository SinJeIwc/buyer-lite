"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  type CurrencyItem,
  itemTypes,
  suppliers,
  userProfiles,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

// ==================== Helper ====================

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

// ==================== Поставщики ====================

export async function getSuppliers() {
  return await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      location: suppliers.location,
    })
    .from(suppliers)
    .orderBy(suppliers.name);
}

export async function addSupplier(name: string, location: string | null) {
  await db.insert(suppliers).values({ name, location });
  revalidatePath("/settings");
  revalidatePath("/suppliers");
}

export async function updateSupplier(
  id: string,
  name: string,
  location: string | null,
) {
  await db
    .update(suppliers)
    .set({ name, location })
    .where(eq(suppliers.id, id));
  revalidatePath("/settings");
  revalidatePath("/suppliers");
}

export async function deleteSupplier(id: string) {
  await db.delete(suppliers).where(eq(suppliers.id, id));
  revalidatePath("/settings");
  revalidatePath("/suppliers");
}

// ==================== Типы товаров ====================

export async function getItemTypes() {
  return await db
    .select({
      id: itemTypes.id,
      name: itemTypes.name,
    })
    .from(itemTypes)
    .orderBy(itemTypes.name);
}

export async function addItemType(name: string) {
  await db.insert(itemTypes).values({ name });
  revalidatePath("/settings");
}

export async function deleteItemType(id: string) {
  await db.delete(itemTypes).where(eq(itemTypes.id, id));
  revalidatePath("/settings");
}

// ==================== Валюты (JSON в user_profiles) ====================

export async function getCurrencies() {
  const userId = await getCurrentUserId();

  const [profile] = await db
    .select({
      currencies: userProfiles.currencies,
      defaultCurrencyCode: userProfiles.defaultCurrencyCode,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId));

  const currenciesList = (profile?.currencies as CurrencyItem[]) ?? [];
  const defaultCode = profile?.defaultCurrencyCode ?? "RUB";

  return currenciesList.map((c) => ({
    ...c,
    isDefault: c.code === defaultCode,
  }));
}

export async function addCurrency(code: string, name: string) {
  const userId = await getCurrentUserId();

  const [profile] = await db
    .select({ currencies: userProfiles.currencies })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId));

  const currentCurrencies = (profile?.currencies as CurrencyItem[]) ?? [];

  // Проверяем, нет ли уже такой валюты
  if (currentCurrencies.some((c) => c.code === code.toUpperCase())) {
    throw new Error("Валюта уже существует");
  }

  const newCurrencies = [
    ...currentCurrencies,
    { code: code.toUpperCase(), name },
  ];

  await db
    .update(userProfiles)
    .set({ currencies: newCurrencies })
    .where(eq(userProfiles.id, userId));

  revalidatePath("/settings");
}

export async function deleteCurrency(code: string) {
  const userId = await getCurrentUserId();

  const [profile] = await db
    .select({ currencies: userProfiles.currencies })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId));

  const currentCurrencies = (profile?.currencies as CurrencyItem[]) ?? [];
  const newCurrencies = currentCurrencies.filter((c) => c.code !== code);

  await db
    .update(userProfiles)
    .set({ currencies: newCurrencies })
    .where(eq(userProfiles.id, userId));

  revalidatePath("/settings");
}

export async function setDefaultCurrency(code: string) {
  const userId = await getCurrentUserId();

  await db
    .update(userProfiles)
    .set({ defaultCurrencyCode: code })
    .where(eq(userProfiles.id, userId));

  revalidatePath("/settings");
}
