"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientChips } from "@/components/orders/client-chips";
import { IsLoading } from "@/components/ui/is-loading";
import { LengthZero } from "@/components/ui/length-zero";
import type { BalanceOperationWithClient } from "@/server/balance";
import { useBalanceHistoryStore } from "@/stores/balance-history-store";
import { BalanceHistoryCard } from "./balance-history-card";
import { BalanceHistoryReportButton } from "./balance-history-report-button";

/** Количество дней, загружаемых за раз */
const DAYS_PER_PAGE = 10;

function groupByDate(operations: BalanceOperationWithClient[]) {
  const groups = new Map<string, BalanceOperationWithClient[]>();

  for (const op of operations) {
    if (!op.createdAt) continue;
    const dateKey = new Date(op.createdAt).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const arr = groups.get(dateKey);
    if (arr) {
      arr.push(op);
    } else {
      groups.set(dateKey, [op]);
    }
  }

  return Array.from(groups.entries());
}

export function BalanceHistoryList() {
  const items = useBalanceHistoryStore((s) => s.items);
  const isLoading = useBalanceHistoryStore((s) => s.isLoading);
  const fetchItems = useBalanceHistoryStore((s) => s.fetchItems);

  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Обработчик смены клиента — сбрасываем видимые дни
  const handleClientChange = useCallback((clientId: string | null) => {
    setActiveClientId(clientId);
    setVisibleDays(DAYS_PER_PAGE);
  }, []);

  // Всегда свежие данные
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Фильтрация по клиенту
  const filtered = useMemo(
    () =>
      activeClientId
        ? items.filter((op) => op.clientId === activeClientId)
        : items,
    [items, activeClientId],
  );
  const allGroups = useMemo(() => groupByDate(filtered), [filtered]);
  const visibleGroups = allGroups.slice(0, visibleDays);
  const hasMore = visibleDays < allGroups.length;

  // Бесконечный скролл
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore) {
        setVisibleDays((prev) => prev + DAYS_PER_PAGE);
      }
    },
    [hasMore],
  );

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) return <IsLoading />;

  return (
    <div className="space-y-3">
      {/* Чипсы клиентов + кнопка отчёта */}
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden">
          <ClientChips
            items={items.map((op) => ({
              clientId: op.clientId,
              clientName: op.clientName,
            }))}
            activeClientId={activeClientId}
            onChange={handleClientChange}
          />
        </div>
        {filtered.length > 0 && (
          <BalanceHistoryReportButton operations={filtered} />
        )}
      </div>

      {/* Список по датам */}
      {filtered.length === 0 ? (
        <LengthZero />
      ) : (
        <>
          {visibleGroups.map(([date, ops]) => (
            <div key={date} className="space-y-1.5">
              <h3 className="text-xs font-medium text-muted-foreground px-1">
                {date}
              </h3>
              {ops.map((op) => (
                <BalanceHistoryCard key={op.id} operation={op} />
              ))}
            </div>
          ))}

          {/* Лоадер для бесконечного скролла */}
          {hasMore && (
            <div ref={loaderRef} className="py-4">
              <IsLoading />
            </div>
          )}
        </>
      )}
    </div>
  );
}
