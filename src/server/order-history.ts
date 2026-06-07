"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  orderPaymentItems,
  orderPayments,
  suppliers,
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

export interface OrderPaymentWithItems {
  id: string;
  clientId: string;
  clientName: string | null;
  supplierId: string;
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

export async function getOrderPayments(): Promise<OrderPaymentWithItems[]> {
  const userId = await getCurrentUserId();

  const rows = await db
    .select({
      id: orderPayments.id,
      clientId: orderPayments.clientId,
      clientName: clients.name,
      supplierId: orderPayments.supplierId,
      supplierName: suppliers.name,
      buyerTotal: orderPayments.buyerTotal,
      purchaseTotal: orderPayments.purchaseTotal,
      createdAt: orderPayments.createdAt,
    })
    .from(orderPayments)
    .leftJoin(clients, eq(orderPayments.clientId, clients.id))
    .leftJoin(suppliers, eq(orderPayments.supplierId, suppliers.id))
    .where(eq(orderPayments.userId, userId))
    .orderBy(desc(orderPayments.createdAt));

  // Загружаем товары для каждой оплаты
  const result: OrderPaymentWithItems[] = [];
  for (const payment of rows) {
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

    result.push({ ...payment, items });
  }

  return result;
}

export interface OrderHistoryStats {
  totalClient: number;
  totalPurchase: number;
  totalMargin: number;
  totalItems: number;
  paymentCount: number;
}

export async function getOrderHistoryStats(): Promise<OrderHistoryStats> {
  const userId = await getCurrentUserId();

  const [row] = await db
    .select({
      totalClient: sql<string>`COALESCE(SUM(${orderPayments.buyerTotal}), 0)`,
      totalPurchase: sql<string>`COALESCE(SUM(${orderPayments.purchaseTotal}), 0)`,
      paymentCount: sql<string>`COUNT(*)`,
    })
    .from(orderPayments)
    .where(eq(orderPayments.userId, userId));

  const totalClient = parseFloat(row?.totalClient ?? "0");
  const totalPurchase = parseFloat(row?.totalPurchase ?? "0");

  // Считаем количество товаров
  const [itemsRow] = await db
    .select({
      totalItems: sql<string>`COALESCE(SUM(${orderPaymentItems.quantity}), 0)`,
    })
    .from(orderPaymentItems)
    .leftJoin(
      orderPayments,
      eq(orderPaymentItems.paymentId, orderPayments.id),
    )
    .where(eq(orderPayments.userId, userId));

  return {
    totalClient,
    totalPurchase,
    totalMargin: totalClient - totalPurchase,
    totalItems: parseInt(itemsRow?.totalItems ?? "0", 10),
    paymentCount: parseInt(row?.paymentCount ?? "0", 10),
  };
}
