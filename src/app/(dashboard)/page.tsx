import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div>
        <h1 className="text-2xl font-bold">
          Привет, {user?.user_metadata?.display_name ?? "Байер"}! 👋
        </h1>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/clients"
          className="bg-primary text-primary-foreground rounded-xl p-6 text-center font-medium hover:opacity-90 transition-opacity"
        >
          Клиенты
        </Link>
        <Link
          href="/suppliers"
          className="bg-primary text-primary-foreground rounded-xl p-6 text-center font-medium hover:opacity-90 transition-opacity"
        >
          Поставщики
        </Link>
        <Link
          href="/orders"
          className="bg-primary text-primary-foreground rounded-xl p-6 text-center font-medium hover:opacity-90 transition-opacity"
        >
          Заказы
        </Link>
        <Link
          href="/settings"
          className="bg-primary text-primary-foreground rounded-xl p-6 text-center font-medium hover:opacity-90 transition-opacity"
        >
          Настройки
        </Link>
      </div>
    </div>
  );
}
