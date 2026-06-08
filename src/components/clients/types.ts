/** Краткие данные клиента (для форм и карточек) */
export interface ClientBrief {
  id: string;
  name: string;
  phone: string | null;
  city: string | null;
  notes: string | null;
}

/** Данные клиента из формы */
export interface ClientFormData {
  name: string;
  phone: string;
  city: string;
  notes: string;
}

/** Тип операции по балансу */
import type { BalanceOperationType } from "./schemas";
export type { BalanceOperationType };

/** Метка типа операции */
export const balanceOperationLabels: Record<BalanceOperationType, string> = {
  deposit: "Пополнение",
  order: "Оплата товара",
  shipping: "Оплата доставки",
  commission: "Комиссия",
  manual: "Ручная корректировка",
};
