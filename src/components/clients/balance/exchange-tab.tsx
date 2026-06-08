"use client";

import { Lock, Unlock } from "lucide-react";
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
import { createDeposit } from "@/server/balance";

interface ExchangeTabProps {
  clientId: string;
  currencies: { code: string; name: string }[];
  defaultCurrency: string;
  onSuccess: () => void;
}

export function ExchangeTab({
  clientId,
  currencies,
  defaultCurrency,
  onSuccess,
}: ExchangeTabProps) {
  const [amountForeign, setAmountForeign] = useState("");
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency);
  const [rateReal, setRateReal] = useState("");
  const [rateClient, setRateClient] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const amountNum = parseFloat(amountForeign) || 0;
  const rateRealNum = parseFloat(rateReal) || 0;
  const rateClientNum = parseFloat(rateClient) || 0;

  const amountKgs = amountNum * rateClientNum;
  const spread = amountNum * (rateRealNum - rateClientNum);

  function handleRateRealChange(value: string) {
    setRateReal(value);
    if (isLocked) {
      setRateClient(value);
    }
  }

  function handleLockToggle() {
    if (!isLocked) {
      setRateClient(rateReal);
    }
    setIsLocked(!isLocked);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amountNum <= 0 || rateRealNum <= 0) return;

    setIsLoading(true);
    try {
      await createDeposit({
        clientId,
        amountForeign: amountNum,
        currencyCode,
        rateReal: rateRealNum,
        rateClient: isLocked ? rateRealNum : rateClientNum,
      });
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Сумма от клиента */}
      <div className="space-y-2">
        <Label htmlFor="amount-foreign">Сумма от клиента</Label>
        <div className="flex gap-2">
          <Input
            id="amount-foreign"
            type="number"
            placeholder="100 000"
            value={amountForeign}
            onChange={(e) => setAmountForeign(e.target.value)}
            className="flex-1"
          />
          <Select
            value={currencyCode}
            onValueChange={(v) => v && setCurrencyCode(v)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Курс реальный */}
      <div className="space-y-2">
        <Label htmlFor="rate-real">Курс реальный</Label>
        <Input
          id="rate-real"
          type="number"
          step="0.0001"
          placeholder="1.16"
          value={rateReal}
          onChange={(e) => handleRateRealChange(e.target.value)}
        />
      </div>

      {/* Курс для клиента */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rate-client">Курс для клиента</Label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleLockToggle}
          >
            {isLocked ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </Button>
        </div>
        <Input
          id="rate-client"
          type="number"
          step="0.0001"
          placeholder="1.16"
          value={rateClient}
          onChange={(e) => setRateClient(e.target.value)}
          disabled={isLocked}
        />
      </div>

      {/* Итоги */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
        {spread !== 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Курсовой спред:</span>
            <span className={spread > 0 ? "text-green-600" : "text-red-600"}>
              {spread > 0 ? "+" : ""}
              {spread.toLocaleString("ru-RU")} с
            </span>
          </div>
        )}
        <div className="flex justify-between font-medium">
          <span>Начисляется:</span>
          <span>{amountKgs.toLocaleString("ru-RU")} с</span>
        </div>
      </div>

      {/* Кнопка */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || amountNum <= 0 || rateRealNum <= 0}
      >
        {isLoading ? "Сохранение..." : "Пополнить"}
      </Button>
    </form>
  );
}
