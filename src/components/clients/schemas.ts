import { z } from "zod";

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
