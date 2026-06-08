import { z } from "zod";

// ── Тип операции по балансу ─────────────────────────────────────

export const balanceOperationTypeSchema = z.enum([
  "deposit",
  "order",
  "shipping",
  "commission",
  "manual",
]);
export type BalanceOperationType = z.infer<typeof balanceOperationTypeSchema>;

// ── Операция по балансу (для рантайм-валидации ответа сервера) ──

export const balanceOperationSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string().nullable(),
  type: balanceOperationTypeSchema,
  amount: z.string(),
  description: z.string().nullable(),
  amountForeign: z.string().nullable(),
  currencyCode: z.string().nullable(),
  rateReal: z.string().nullable(),
  rateClient: z.string().nullable(),
  createdAt: z.date().nullable(),
});
export type BalanceOperation = z.infer<typeof balanceOperationSchema>;

// ── Создание / редактирование клиента ──────────────────────────

export const clientFormSchema = z.object({
  name: z.string().min(1, "Укажите имя"),
  phone: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});
export type ClientFormValues = z.infer<typeof clientFormSchema>;

// ── Ручная операция по балансу ─────────────────────────────────

export const manualOperationSchema = z.object({
  type: z.enum(["deposit", "order", "shipping", "commission", "manual"]),
  amount: z.number().refine((v) => v !== 0, "Сумма не может быть нулевой"),
  description: z.string().optional(),
});
export type ManualOperationValues = z.infer<typeof manualOperationSchema>;

// ── Пополнение через обмен валюты ──────────────────────────────

export const exchangeDepositSchema = z.object({
  amountForeign: z.number().positive("Сумма должна быть больше нуля"),
  currencyCode: z.string().min(1, "Выберите валюту"),
  rateReal: z.number().positive("Курс должен быть больше нуля"),
  rateClient: z.number().positive("Курс должен быть больше нуля"),
});
export type ExchangeDepositValues = z.infer<typeof exchangeDepositSchema>;
