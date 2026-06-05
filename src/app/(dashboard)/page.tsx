import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { clients, orders, shipments } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

async function getStats() {
  const [clientsCount] = await db.select({ count: count() }).from(clients);

  const [activeOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.status, "planned"));

  const [activeShipments] = await db
    .select({ count: count() })
    .from(shipments)
    .where(eq(shipments.status, "preparing"));

  return {
    clients: clientsCount?.count ?? 0,
    activeOrders: activeOrders?.count ?? 0,
    activeShipments: activeShipments?.count ?? 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stats = await getStats();

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div>
        <h1 className="text-2xl font-bold">
          Привет, {user?.user_metadata?.display_name ?? "Байер"}! 👋
        </h1>
        <p className="text-muted-foreground">Вот краткий обзор твоего дня</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        <Link
          href="/clients"
          className="bg-card rounded-xl p-4 border hover:bg-accent transition-colors"
        >
          <div className="text-3xl font-bold">{stats.clients}</div>
          <div className="text-sm text-muted-foreground">Клиентов</div>
        </Link>

        <Link
          href="/orders"
          className="bg-card rounded-xl p-4 border hover:bg-accent transition-colors"
        >
          <div className="text-3xl font-bold text-orange-500">
            {stats.activeOrders}
          </div>
          <div className="text-sm text-muted-foreground">Заказов</div>
        </Link>

        <Link
          href="/shipments"
          className="bg-card rounded-xl p-4 border hover:bg-accent transition-colors"
        >
          <div className="text-3xl font-bold text-blue-500">
            {stats.activeShipments}
          </div>
          <div className="text-sm text-muted-foreground">Отправок</div>
        </Link>
      </div>

      {/* Быстрые действия */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/clients"
            className="bg-primary text-primary-foreground rounded-xl p-4 text-center font-medium hover:opacity-90 transition-opacity"
          >
            + Клиент
          </Link>
          <Link
            href="/orders/new"
            className="bg-primary text-primary-foreground rounded-xl p-4 text-center font-medium hover:opacity-90 transition-opacity"
          >
            + Заказ
          </Link>
        </div>
      </div>

      {/* Информация */}
      <div className="bg-muted/50 rounded-xl p-4">
        <h3 className="font-medium mb-2">💡 Подсказка</h3>
        <p className="text-sm text-muted-foreground">
          Используй кнопки выше для быстрого доступа к клиентам и заказам. В
          настройках можно изменить тему оформления и добавить новых
          поставщиков.
        </p>
      </div>
    </div>
  );
}
