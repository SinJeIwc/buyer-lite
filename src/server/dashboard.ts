"use server";

import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  balanceOperations,
  clients,
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
  if (!user) throw new Error("Не авторизован");
  return user.id;
}

// ==================== Типы ====================

export interface DashboardStats {
  today: PeriodStats;
  month: PeriodStats;
  year: PeriodStats;
  topClients: TopClient[];
  topSupplier: TopSupplier | null;
  clientDebt: number;
  monthComparison: MonthComparison | null;
}

export interface PeriodStats {
  total: number;
  commission: number;
  spread: number;
  orderDiscount: number;
  shipping: number;
  count: number;
  ordersCount: number;
  shipmentsCount: number;
  avgOrderValue: number;
  avgCommission: number;
  marginPercent: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  total: number;
}

export interface TopSupplier {
  supplierId: string;
  supplierName: string;
  ordersCount: number;
  totalSpent: number;
}

export interface MonthComparison {
  currentTotal: number;
  previousTotal: number;
  changePercent: number;
}

// ==================== Запрос ====================

export async function getDashboardStats(): Promise<DashboardStats> {
  const userId = await getCurrentUserId();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Предыдущий месяц
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Параллельные запросы
  const [
    todayOps,
    monthOps,
    yearOps,
    todaySpread,
    monthSpread,
    yearSpread,
    topClients,
    todayOrders,
    monthOrders,
    yearOrders,
    todayOrderStats,
    monthOrderStats,
    yearOrderStats,
    todayShipmentStats,
    monthShipmentStats,
    yearShipmentStats,
    topSupplierData,
    clientDebtData,
    prevMonthEarnings,
  ] = await Promise.all([
    // Транзакции за сегодня
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

    // Транзакции за месяц
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

    // Транзакции за год
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
          gte(balanceOperations.createdAt, startOfYear),
          sql`${balanceOperations.type} IN ('commission', 'shipping')`,
        ),
      )
      .groupBy(balanceOperations.type),

    // Спред за сегодня
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

    // Спред за год
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
          gte(balanceOperations.createdAt, startOfYear),
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

    // Скидка за сегодня
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

    // Скидка за месяц
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

    // Скидка за год
    db
      .select({
        discount: sql<string>`COALESCE(SUM(${orderPayments.purchaseTotal}::numeric - ${orderPayments.buyerTotal}::numeric), 0)`,
      })
      .from(orderPayments)
      .where(
        and(
          eq(orderPayments.userId, userId),
          gte(orderPayments.createdAt, startOfYear),
        ),
      ),

    // Статистика заказов за сегодня
    db
      .select({
        count: sql<string>`COUNT(*)`,
        totalPurchase: sql<string>`COALESCE(SUM(${orderPayments.purchaseTotal}::numeric), 0)`,
        totalBuyer: sql<string>`COALESCE(SUM(${orderPayments.buyerTotal}::numeric), 0)`,
      })
      .from(orderPayments)
      .where(
        and(
          eq(orderPayments.userId, userId),
          gte(orderPayments.createdAt, startOfDay),
        ),
      ),

    // Статистика заказов за месяц
    db
      .select({
        count: sql<string>`COUNT(*)`,
        totalPurchase: sql<string>`COALESCE(SUM(${orderPayments.purchaseTotal}::numeric), 0)`,
        totalBuyer: sql<string>`COALESCE(SUM(${orderPayments.buyerTotal}::numeric), 0)`,
      })
      .from(orderPayments)
      .where(
        and(
          eq(orderPayments.userId, userId),
          gte(orderPayments.createdAt, startOfMonth),
        ),
      ),

    // Статистика заказов за год
    db
      .select({
        count: sql<string>`COUNT(*)`,
        totalPurchase: sql<string>`COALESCE(SUM(${orderPayments.purchaseTotal}::numeric), 0)`,
        totalBuyer: sql<string>`COALESCE(SUM(${orderPayments.buyerTotal}::numeric), 0)`,
      })
      .from(orderPayments)
      .where(
        and(
          eq(orderPayments.userId, userId),
          gte(orderPayments.createdAt, startOfYear),
        ),
      ),

    // Статистика отправок за сегодня
    db
      .select({
        count: sql<string>`COUNT(*)`,
        totalCommission: sql<string>`COALESCE(SUM(${shipments.commissionAmount}::numeric), 0)`,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.userId, userId),
          eq(shipments.status, "shipped"),
          gte(shipments.shippedAt, startOfDay),
        ),
      ),

    // Статистика отправок за месяц
    db
      .select({
        count: sql<string>`COUNT(*)`,
        totalCommission: sql<string>`COALESCE(SUM(${shipments.commissionAmount}::numeric), 0)`,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.userId, userId),
          eq(shipments.status, "shipped"),
          gte(shipments.shippedAt, startOfMonth),
        ),
      ),

    // Статистика отправок за год
    db
      .select({
        count: sql<string>`COUNT(*)`,
        totalCommission: sql<string>`COALESCE(SUM(${shipments.commissionAmount}::numeric), 0)`,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.userId, userId),
          eq(shipments.status, "shipped"),
          gte(shipments.shippedAt, startOfYear),
        ),
      ),

    // Топ поставщик за месяц
    db
      .select({
        supplierId: orderPayments.supplierId,
        supplierName: suppliers.name,
        ordersCount: sql<string>`COUNT(*)`,
        totalSpent: sql<string>`COALESCE(SUM(${orderPayments.purchaseTotal}::numeric), 0)`,
      })
      .from(orderPayments)
      .leftJoin(suppliers, eq(orderPayments.supplierId, suppliers.id))
      .where(
        and(
          eq(orderPayments.userId, userId),
          gte(orderPayments.createdAt, startOfMonth),
        ),
      )
      .groupBy(orderPayments.supplierId, suppliers.name)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(1),

    // Долг клиентов
    db
      .select({
        totalDebt: sql<string>`COALESCE(SUM(ABS(${clients.balance}::numeric)), 0)`,
      })
      .from(clients)
      .where(and(eq(clients.userId, userId), lt(clients.balance, sql`0`))),

    // Заработок за прошлый месяц (для сравнения)
    db
      .select({
        total: sql<string>`COALESCE(SUM(ABS(${balanceOperations.amount})), 0)`,
      })
      .from(balanceOperations)
      .where(
        and(
          eq(balanceOperations.userId, userId),
          gte(balanceOperations.createdAt, startOfPrevMonth),
          lt(balanceOperations.createdAt, endOfPrevMonth),
          sql`${balanceOperations.type} IN ('commission', 'deposit')`,
        ),
      ),
  ]);

  // Собираем статистику
  function buildPeriodStats(
    ops: { type: string; total: string; count: string }[],
    spreadData: { spread: string; count: string },
    orderDiscount: number,
    orderStats: { count: string; totalPurchase: string; totalBuyer: string },
    shipmentStats: { count: string; totalCommission: string },
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

    const ordersCount = parseInt(orderStats.count, 10);
    const shipmentsCount = parseInt(shipmentStats.count, 10);
    const totalPurchase = parseFloat(orderStats.totalPurchase);
    const totalBuyer = parseFloat(orderStats.totalBuyer);
    const avgOrderValue = ordersCount > 0 ? totalPurchase / ordersCount : 0;
    const avgCommission =
      shipmentsCount > 0
        ? parseFloat(shipmentStats.totalCommission) / shipmentsCount
        : 0;
    const marginPercent =
      totalPurchase > 0
        ? ((totalPurchase - totalBuyer) / totalPurchase) * 100
        : 0;

    return {
      total: commission + spread + orderDiscount,
      commission,
      spread,
      orderDiscount,
      shipping,
      count,
      ordersCount,
      shipmentsCount,
      avgOrderValue,
      avgCommission,
      marginPercent,
    };
  }

  // Сравнение с прошлым месяцем
  const currentTotal = buildPeriodStats(
    monthOps,
    monthSpread[0],
    parseFloat(monthOrders[0]?.discount ?? "0"),
    monthOrderStats[0],
    monthShipmentStats[0],
  ).total;
  const previousTotal = parseFloat(prevMonthEarnings[0]?.total ?? "0");
  const changePercent =
    previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

  return {
    today: buildPeriodStats(
      todayOps,
      todaySpread[0],
      parseFloat(todayOrders[0]?.discount ?? "0"),
      todayOrderStats[0],
      todayShipmentStats[0],
    ),
    month: buildPeriodStats(
      monthOps,
      monthSpread[0],
      parseFloat(monthOrders[0]?.discount ?? "0"),
      monthOrderStats[0],
      monthShipmentStats[0],
    ),
    year: buildPeriodStats(
      yearOps,
      yearSpread[0],
      parseFloat(yearOrders[0]?.discount ?? "0"),
      yearOrderStats[0],
      yearShipmentStats[0],
    ),
    topClients: topClients.map((c) => ({
      clientId: c.clientId,
      clientName: c.clientName || "—",
      total: parseFloat(c.total),
    })),
    topSupplier: topSupplierData[0]
      ? {
          supplierId: topSupplierData[0].supplierId,
          supplierName: topSupplierData[0].supplierName || "—",
          ordersCount: parseInt(topSupplierData[0].ordersCount, 10),
          totalSpent: parseFloat(topSupplierData[0].totalSpent),
        }
      : null,
    clientDebt: parseFloat(clientDebtData[0]?.totalDebt ?? "0"),
    monthComparison:
      previousTotal > 0
        ? {
            currentTotal,
            previousTotal,
            changePercent,
          }
        : null,
  };
}
