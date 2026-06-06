"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrencies } from "@/server/settings";
import { ExchangeTab } from "./exchange-tab";
import { ManualTab } from "./manual-tab";

interface BalanceButtonProps {
  clientId: string;
  onSuccess: () => void;
}

export function BalanceButton({ clientId, onSuccess }: BalanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currencies, setCurrencies] = useState<
    { code: string; name: string }[]
  >([]);
  const [defaultCurrency, setDefaultCurrency] = useState("RUB");

  const loadCurrencies = useCallback(async () => {
    try {
      const data = await getCurrencies();
      setCurrencies(data);
      const defaultCurr = data.find((c) => c.isDefault);
      if (defaultCurr) {
        setDefaultCurrency(defaultCurr.code);
      }
    } catch {
      // Ошибка загрузки валют
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCurrencies();
    }
  }, [isOpen, loadCurrencies]);

  function handleSuccess() {
    setIsOpen(false);
    onSuccess();
  }

  return (
    <>
      <Button variant="outline" className="" onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4" />
        Пополнить
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Пополнить баланс</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="exchange">
            <TabsList className="w-full">
              <TabsTrigger value="exchange" className="flex-1">
                Обмен валют
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                Ручная операция
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exchange" className="mt-4">
              <ExchangeTab
                clientId={clientId}
                currencies={currencies}
                defaultCurrency={defaultCurrency}
                onSuccess={handleSuccess}
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <ManualTab clientId={clientId} onSuccess={handleSuccess} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
