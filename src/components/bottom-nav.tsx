"use client";

import { Home, Package, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Главная",
    icon: Home,
  },
  {
    href: "/clients",
    label: "Клиенты",
    icon: Users,
  },
  {
    href: "/orders",
    label: "Заказы",
    icon: ShoppingBag,
  },
  {
    href: "/shipments",
    label: "Отправки",
    icon: Package,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
