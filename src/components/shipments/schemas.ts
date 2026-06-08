import { z } from "zod";

// Создание / редактирование отправки "готовится"
export const preparingShipmentSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  destination: z.string().min(1, "Укажите куда едет"),
  code: z.string().optional(),
  notes: z.string().optional(),
});
export type PreparingShipmentValues = z.infer<typeof preparingShipmentSchema>;

// Отправка / редактирование "отправлено"
export const shippedShipmentSchema = z.object({
  code: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  notes: z.string().optional(),
});
export type ShippedShipmentValues = z.infer<typeof shippedShipmentSchema>;

// Редактирование товара на складе
export const editStorageItemSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  name: z.string().min(1, "Укажите название"),
  size: z.string().optional(),
  quantity: z.number().int().min(1, "Минимум 1"),
  purchasePrice: z.number().min(0, "Цена не может быть отрицательной"),
});
export type EditStorageItemValues = z.infer<typeof editStorageItemSchema>;
