"use server";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { balanceOperations, clients, orderPayments } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизован");
  return user.id;
}

// ==================== Типы ====================

export interface DashboardStats {
  today: PeriodStats;
  month: PeriodStats;
  topClients: TopClient[];
}

export interface PeriodStats {
  total: number;
  commission: number;
  spread: number;
  orderDiscount: number;
  shipping: number;
  count: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  total: number;
}

// ==================== Запрос ====================

export async function getDashboardStats(): Promise<DashboardStats> {
  const userId = await getCurrentUserId();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Параллельные запросы
  const [
    todayOps,
    monthOps,
    todaySpread,
    monthSpread,
    topClients,
    todayOrders,
    monthOrders,
  ] = await Promise.all([
    // Транзакции за сегодня (commission, shipping)
    db
      .select({
        type: balanceOperations.type,
        total: sql<string>`COALESCE(SUM(ABS(${balanceOperations.amount})), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(balanceOperations)
      .where(
        and(
          eq(balanceOperations.userId, userId),
          gte(balanceOperations.createdAt, startOfDay),
          sql`${balanceOperations.type} IN ('commission', 'shipping')`,
        ),
      )
      .groupBy(balanceOperations.type),

    // Транзакции за месяц (commission, shipping)
    db
      .select({
        type: balanceOperations.type,
        total: sql<string>`COALESCE(SUM(ABS(${balanceOperations.amount})), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(balanceOperations)
      .where(
        and(
          eq(balanceOperations.userId, userId),
          gte(balanceOperations.createdAt, startOfMonth),
          sql`${balanceOperations.type} IN ('commission', 'shipping')`,
        ),
      )
      .groupBy(balanceOperations.type),

    // Спред за сегодня: amountForeign * (rateReal - rateClient)
    db
      .select({
        spread: sql<string>`COALESCE(SUM(
          ${balanceOperations.amountForeign}::numeric * 
          (${balanceOperations.rateReal}::numeric - ${balanceOperations.rateClient}::numeric)
        ), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(balanceOperations)
      .where(
        and(
          eq(balanceOperations.userId, userId),
          gte(balanceOperations.createdAt, startOfDay),
          eq(balanceOperations.type, "deposit"),
        ),
      ),

    // Спред за месяц
    db
      .select({
        spread: sql<string>`COALESCE(SUM(
          ${balanceOperations.amountForeign}::numeric * 
          (${balanceOperations.rateReal}::numeric - ${balanceOperations.rateClient}::numeric)
        ), 0)`,
        count: sql<string>`COUNT(*)`,
      })
      .from(balanceOperations)
      .where(
        and(
          eq(balanceOperations.userId, userId),
          gte(balanceOperations.createdAt, startOfMonth),
          eq(balanceOperations.type, "deposit"),
        ),
      ),

    // Топ клиентов за месяц
    db
      .select({
        clientId: balanceOperations.clientId,
        clientName: clients.name,
        total: sql<string>`COALESCE(SUM(ABS(${balanceOperations.amount})), 0)`,
      })
      .from(balanceOperations)
      .leftJoin(clients, eq(balanceOperations.clientId, clients.id))
      .where(
        and(
          eq(balanceOperations.userId, userId),
          gte(balanceOperations.createdAt, startOfMonth),
        ),
      )
      .groupBy(balanceOperations.clientId, clients.name)
      .orderBy(desc(sql`SUM(ABS(${balanceOperations.amount}))`))
      .limit(10),

    // Скидка при оплате заказов за сегодня
    db
      .select({
        discount: sql<string>`COALESCE(SUM(${orderPayments.purchaseTotal}::numeric - ${orderPayments.buyerTotal}::numeric), 0)`,
      })
      .from(orderPayments)
      .where(
        and(
          eq(orderPayments.userId, userId),
          gte(orderPayments.createdAt, startOfDay),
        ),
      ),

    // Скидка при оплате заказов за месяц
    db
      .select({
        discount: sql<string>`COALESCE(SUM(${orderPayments.purchaseTotal}::numeric - ${orderPayments.buyerTotal}::numeric), 0)`,
      })
      .from(orderPayments)
      .where(
        and(
          eq(orderPayments.userId, userId),
          gte(orderPayments.createdAt, startOfMonth),
        ),
      ),
  ]);

  // Собираем статистику
  function buildPeriodStats(
    ops: { type: string; total: string; count: string }[],
    spreadData: { spread: string; count: string },
    orderDiscount: number,
  ): PeriodStats {
    const byType: Record<string, number> = {};
    let count = 0;
    for (const op of ops) {
      byType[op.type] = parseFloat(op.total);
      count += parseInt(op.count, 10);
    }

    const commission = byType.commission || 0;
    const spread = Math.abs(parseFloat(spreadData.spread));
    const shipping = byType.shipping || 0;
    count += parseInt(spreadData.count, 10);

    return {
      total: commission + spread + orderDiscount,
      commission,
      spread,
      orderDiscount,
      shipping,
      count,
    };
  }

  return {
    today: buildPeriodStats(
      todayOps,
      todaySpread[0],
      parseFloat(todayOrders[0]?.discount ?? "0"),
    ),
    month: buildPeriodStats(
      monthOps,
      monthSpread[0],
      parseFloat(monthOrders[0]?.discount ?? "0"),
    ),
    topClients: topClients.map((c) => ({
      clientId: c.clientId,
      clientName: c.clientName || "—",
      total: parseFloat(c.total),
    })),
  };
}
