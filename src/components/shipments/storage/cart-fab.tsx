"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartFabProps {
  count: number;
  onClick: () => void;
}

export function CartFab({ count, onClick }: CartFabProps) {
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Button
        size="lg"
        className="rounded-full size-14 shadow-lg relative"
        onClick={onClick}
      >
        <ShoppingCart className="size-6" />
        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full size-5 flex items-center justify-center">
          {count}
        </span>
      </Button>
    </div>
  );
}
