"use client";

import { ChevronDown, ChevronUp, Star, StarOff, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  deleteCurrency,
  getCurrencies,
  setDefaultCurrency,
} from "@/server/settings";

interface Currency {
  code: string;
  name: string;
  isDefault: boolean;
}

export function CurrenciesList() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const loadCurrencies = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await getCurrencies();
      setCurrencies(data);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
  }, [loadCurrencies]);

  async function handleDelete() {
    if (!deleteCode) return;
    await deleteCurrency(deleteCode);
    setDeleteCode(null);
    await loadCurrencies();
  }

  async function handleSetDefault(code: string) {
    await setDefaultCurrency(code);
    await loadCurrencies();
  }

  const displayedCurrencies = showAll ? currencies : currencies.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Список валют */}
      {isLoadingList ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : currencies.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Пока нет валют
        </p>
      ) : (
        <div className="space-y-2">
          {displayedCurrencies.map((currency) => (
            <div
              key={currency.code}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-10 flex items-center justify-center bg-primary/10 rounded-lg font-mono font-bold text-sm">
                  {currency.code}
                </div>
                <div className="font-medium">{currency.name}</div>
              </div>
              <div className="flex items-center gap-1">
                {/* Звездочка - дефолтная валюта */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleSetDefault(currency.code)}
                >
                  {currency.isDefault ? (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="w-5 h-5 text-muted-foreground" />
                  )}
                </Button>

                {/* Корзина - удаление */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteCode(currency.code)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Кнопка "Показать все" */}
          {currencies.length > 3 && !showAll && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowAll(true)}
            >
              <ChevronDown className="w-4 h-4 mr-1" />
              Показать все ({currencies.length})
            </Button>
          )}
          {showAll && currencies.length > 3 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowAll(false)}
            >
              <ChevronUp className="w-4 h-4 mr-1" />
              Свернуть
            </Button>
          )}
        </div>
      )}

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={!!deleteCode} onOpenChange={() => setDeleteCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить валюту?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Валюта будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
