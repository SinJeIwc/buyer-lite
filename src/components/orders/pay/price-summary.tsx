"use client";

import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceSummaryProps {
  total: number;
  clientPrice: string;
  isLocked: boolean;
  onClientPriceChange: (value: string) => void;
  onLockToggle: () => void;
}

export function PriceSummary({
  total,
  clientPrice,
  isLocked,
  onClientPriceChange,
  onLockToggle,
}: PriceSummaryProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex justify-between text-sm">
        <span>Итого:</span>
        <span className="font-medium">{total.toLocaleString("ru-RU")} с</span>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-sm shrink-0">Для клиента:</Label>
        <div className="flex-1 flex items-center gap-1">
          <Input
            type="number"
            value={clientPrice}
            onChange={(e) => onClientPriceChange(e.target.value)}
            disabled={isLocked}
            className="h-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onLockToggle}
          >
            {isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
