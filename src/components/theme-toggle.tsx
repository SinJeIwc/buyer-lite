"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Тема оформления</Label>
        <p className="text-sm text-muted-foreground">
          Выберите светлую или тёмную тему
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant={theme === "light" ? "default" : "outline"}
          onClick={() => setTheme("light")}
          className="flex-1"
        >
          ☀️ Светлая
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          onClick={() => setTheme("dark")}
          className="flex-1"
        >
          🌙 Тёмная
        </Button>
      </div>
    </div>
  );
}
