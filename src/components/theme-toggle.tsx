"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={() => setTheme("light")}
        className="flex-1 dark:bg-accent"
      >
        <SunIcon className="text-yellow-400 dark:text-foreground" />
        Светлая
      </Button>
      <Button
        variant="outline"
        onClick={() => setTheme("dark")}
        className="flex-1 bg-accent "
      >
        <MoonIcon className="text-foreground dark:text-blue-400" />
        Тёмная
      </Button>
    </div>
  );
}
