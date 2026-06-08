"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  balanceOperations,
  clients,
  orderPaymentItems,
  orderPayments,
  shipments,
  suppliers,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

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

// ==================== Получить операции клиента ====================

export async function getBalanceOperations(clientId: string) {
  const userId = await getCurrentUserId();

  return await db
    .select({
      id: balanceOperations.id,
      type: balanceOperations.type,
      amount: balanceOperations.amount,
      description: balanceOperations.description,
      amountForeign: balanceOperations.amountForeign,
      currencyCode: balanceOperations.currencyCode,
      rateReal: balanceOperations.rateReal,
      rateClient: balanceOperations.rateClient,
      createdAt: balanceOperations.createdAt,
    })
    .from(balanceOperations)
    .where(
      and(
        eq(balanceOperations.clientId, clientId),
        eq(balanceOperations.userId, userId),
      ),
    )
    .orderBy(desc(balanceOperations.createdAt));
}

// ==================== Пополнение (обмен валюты) ====================

export interface DepositData {
  clientId: string;
  amountForeign: number;
  currencyCode: string;
  rateReal: number;
  rateClient: number;
}

export async function createDeposit(data: DepositData) {
  const userId = await getCurrentUserId();

  // Проверяем, что клиент принадлежит пользователю
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, data.clientId), eq(clients.userId, userId)));

  if (!client) {
    throw new Error("Клиент не найден");
  }

  // Начисляем клиенту по курсу для клиента
  const amountKgs = data.amountForeign * data.rateClient;

  // Создаём операцию
  await db.insert(balanceOperations).values({
    clientId: data.clientId,
    userId,
    type: "deposit",
    amount: amountKgs.toFixed(2),
    description: `Обмен ${data.amountForeign.toLocaleString("ru-RU")} ${data.currencyCode}`,
    amountForeign: data.amountForeign.toFixed(2),
    currencyCode: data.currencyCode,
    rateReal: data.rateReal.toFixed(4),
    rateClient: data.rateClient.toFixed(4),
  });

  // Обновляем баланс клиента
  await db
    .update(clients)
    .set({
      balance: sql`${clients.balance} + ${amountKgs.toFixed(2)}`,
    })
    .where(eq(clients.id, data.clientId));

  revalidatePath("/clients");
}

// ==================== Ручная операция ====================

export interface ManualOperationData {
  clientId: string;
  type: "deposit" | "order" | "shipping" | "commission" | "manual";
  amount: number;
  description: string;
}

export async function createManualOperation(data: ManualOperationData) {
  const userId = await getCurrentUserId();

  // Проверяем, что клиент принадлежит пользователю
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, data.clientId), eq(clients.userId, userId)));

  if (!client) {
    throw new Error("Клиент не найден");
  }

  // Создаём операцию
  await db.insert(balanceOperations).values({
    clientId: data.clientId,
    userId,
    type: data.type,
    amount: data.amount.toFixed(2),
    description: data.description || null,
  });

  // Обновляем баланс клиента
  await db
    .update(clients)
    .set({
      balance: sql`${clients.balance} + ${data.amount.toFixed(2)}`,
    })
    .where(eq(clients.id, data.clientId));

  revalidatePath("/clients");
}

// ==================== История баланса (все клиенты) ====================

export interface BalanceOperationWithClient {
  id: string;
  clientId: string;
  clientName: string | null;
  type: string;
  amount: string;
  description: string | null;
  referenceId: string | null;
  amountForeign: string | null;
  currencyCode: string | null;
  rateReal: string | null;
  rateClient: string | null;
  createdAt: Date | null;
}

export async function getBalanceHistory(): Promise<
  BalanceOperationWithClient[]
> {
  const userId = await getCurrentUserId();

  return await db
    .select({
      id: balanceOperations.id,
      clientId: balanceOperations.clientId,
      clientName: clients.name,
      type: balanceOperations.type,
      amount: balanceOperations.amount,
      description: balanceOperations.description,
      referenceId: balanceOperations.referenceId,
      amountForeign: balanceOperations.amountForeign,
      currencyCode: balanceOperations.currencyCode,
      rateReal: balanceOperations.rateReal,
      rateClient: balanceOperations.rateClient,
      createdAt: balanceOperations.createdAt,
    })
    .from(balanceOperations)
    .leftJoin(clients, eq(balanceOperations.clientId, clients.id))
    .where(eq(balanceOperations.userId, userId))
    .orderBy(desc(balanceOperations.createdAt));
}

// ==================== Детали транзакции ====================

export interface OrderPaymentDetail {
  id: string;
  supplierName: string | null;
  buyerTotal: string;
  purchaseTotal: string;
  createdAt: Date | null;
  items: Array<{
    id: string;
    name: string;
    size: string | null;
    quantity: number;
    purchasePrice: string;
    buyerPrice: string;
  }>;
}

export async function getOrderPaymentDetail(
  paymentId: string,
): Promise<OrderPaymentDetail | null> {
  const userId = await getCurrentUserId();

  const [payment] = await db
    .select({
      id: orderPayments.id,
      supplierName: suppliers.name,
      buyerTotal: orderPayments.buyerTotal,
      purchaseTotal: orderPayments.purchaseTotal,
      createdAt: orderPayments.createdAt,
    })
    .from(orderPayments)
    .leftJoin(suppliers, eq(orderPayments.supplierId, suppliers.id))
    .where(
      and(eq(orderPayments.id, paymentId), eq(orderPayments.userId, userId)),
    );

  if (!payment) return null;

  const items = await db
    .select({
      id: orderPaymentItems.id,
      name: orderPaymentItems.name,
      size: orderPaymentItems.size,
      quantity: orderPaymentItems.quantity,
      purchasePrice: orderPaymentItems.purchasePrice,
      buyerPrice: orderPaymentItems.buyerPrice,
    })
    .from(orderPaymentItems)
    .where(eq(orderPaymentItems.paymentId, payment.id));

  return { ...payment, items };
}

export interface ShipmentDetail {
  id: string;
  code: string | null;
  destination: string | null;
  shippingCost: string | null;
  notes: string | null;
  shippedAt: Date | null;
}

export async function getShipmentDetail(
  shipmentId: string,
): Promise<ShipmentDetail | null> {
  const userId = await getCurrentUserId();

  const [shipment] = await db
    .select({
      id: shipments.id,
      code: shipments.code,
      destination: shipments.destination,
      shippingCost: shipments.shippingCost,
      notes: shipments.notes,
      shippedAt: shipments.shippedAt,
    })
    .from(shipments)
    .where(and(eq(shipments.id, shipmentId), eq(shipments.userId, userId)));

  return shipment ?? null;
}
