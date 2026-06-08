import { z } from "zod";

// ── Создание заказа ────────────────────────────────────────────

export const orderItemSchema = z.object({
  name: z.string().min(1, "Укажите название"),
  size: z.string().optional(),
  quantity: z.number().int().min(1, "Минимум 1"),
  purchasePrice: z.number().min(0, "Цена не может быть отрицательной"),
});

export const newOrderSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  items: z.array(orderItemSchema).min(1, "Добавьте хотя бы один товар"),
});
export type NewOrderValues = z.infer<typeof newOrderSchema>;

// ── Редактирование товара в заказе ─────────────────────────────

export const editOrderItemSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  name: z.string().min(1, "Укажите название"),
  size: z.string().optional(),
  quantity: z.number().int().min(1, "Минимум 1"),
  purchasePrice: z.number().min(0, "Цена не может быть отрицательной"),
});
export type EditOrderItemValues = z.infer<typeof editOrderItemSchema>;

// ── Оплата заказа ──────────────────────────────────────────────

export const payOrderSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  items: z
    .array(
      z.object({
        supplierItemId: z.string().optional(),
        isNew: z.boolean(),
        name: z.string().min(1),
        quantity: z.number().int().min(1),
        purchasePrice: z.number().min(0),
      }),
    )
    .min(1, "Выберите хотя бы один товар"),
  clientPriceTotal: z.number().min(0),
});
export type PayOrderValues = z.infer<typeof payOrderSchema>;
