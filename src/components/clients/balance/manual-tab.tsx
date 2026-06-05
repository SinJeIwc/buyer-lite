"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createManualOperation } from "@/server/balance";

const operationTypes = [
  { value: "manual", label: "Ручная корректировка" },
  { value: "deposit", label: "Пополнение" },
  { value: "order", label: "Оплата товара" },
  { value: "shipping", label: "Оплата доставки" },
  { value: "commission", label: "Комиссия" },
];

interface ManualTabProps {
  clientId: string;
  onSuccess: () => void;
}

export function ManualTab({ clientId, onSuccess }: ManualTabProps) {
  const [type, setType] = useState("manual");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const amountNum = parseFloat(amount) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amountNum === 0) return;

    setIsLoading(true);
    try {
      await createManualOperation({
        clientId,
        type: type as
          | "deposit"
          | "order"
          | "shipping"
          | "commission"
          | "manual",
        amount: amountNum,
        description,
      });
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Тип операции */}
      <div className="space-y-2">
        <Label>Тип операции</Label>
        <Select value={type} onValueChange={(v) => v && setType(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operationTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Сумма */}
      <div className="space-y-2">
        <Label htmlFor="amount">Сумма (KGS)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="-100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Положительное число — пополнение, отрицательное — списание
        </p>
      </div>

      {/* Описание */}
      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          placeholder="За дорогу..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Кнопка */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || amountNum === 0}
      >
        {isLoading ? "Сохранение..." : "Добавить"}
      </Button>
    </form>
  );
}
