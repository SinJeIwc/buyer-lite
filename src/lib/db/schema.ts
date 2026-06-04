import {
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Валюты теперь хранятся в user_profiles.currencies (JSON массив)
// Формат: [{"code": "RUB", "name": "Российский рубль"}, ...]

// Поставщики (точки на Дордое)
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // Айлин, Дина и т.д.
  location: text("location"), // Опционально
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Типы товаров
export const itemTypes = pgTable("item_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // Блузка, юбка, платье, штаны
  createdAt: timestamp("created_at").defaultNow(),
});

// Клиенты
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  telegram: text("telegram"),
  city: text("city"), // Город доставки
  defaultCurrencyCode: text("default_currency_code"), // Код валюты (RUB, KGS и т.д.)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Заказы (от поставщика)
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  status: text("status").notNull().default("planned"), // planned / purchased / ready / shipped
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Товары в заказе
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  itemTypeId: uuid("item_type_id")
    .references(() => itemTypes.id)
    .notNull(),
  externalId: text("external_id"), // ID у поставщика
  quantity: integer("quantity").notNull(),
  purchasePrice: decimal("purchase_price", {
    precision: 10,
    scale: 2,
  }).notNull(), // Реальная цена в KGS
  clientPrice: decimal("client_price", { precision: 10, scale: 2 }).notNull(), // Цена для клиента в KGS
  name: text("name"), // Опциональное название
  size: text("size"), // Опционально
  color: text("color"), // Опционально
  notes: text("notes"),
});

// Отправки (карго)
export const shipments = pgTable("shipments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  status: text("status").notNull().default("preparing"), // preparing / shipped / delivered
  destination: text("destination"), // Куда едет
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }), // Стоимость доставки в KGS
  notes: text("notes"), // Что написано на мешке
  createdAt: timestamp("created_at").defaultNow(),
  shippedAt: timestamp("shipped_at"),
});

// Товары в отправке
export const shipmentItems = pgTable("shipment_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  shipmentId: uuid("shipment_id")
    .references(() => shipments.id)
    .notNull(),
  orderItemId: uuid("order_item_id")
    .references(() => orderItems.id)
    .notNull(),
  quantity: integer("quantity").notNull(), // Может быть часть от общего количества
});

// Операции обмена валюты
export const exchangeOperations = pgTable("exchange_operations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  amountForeign: decimal("amount_foreign", {
    precision: 12,
    scale: 2,
  }).notNull(), // Сумма в валюте клиента
  currencyCode: text("currency_code").notNull(), // Код валюты (RUB, KGS и т.д.)
  rateReal: decimal("rate_real", { precision: 10, scale: 4 }).notNull(), // Реальный курс
  rateClient: decimal("rate_client", { precision: 10, scale: 4 }).notNull(), // Курс для клиента
  amountKgsReal: decimal("amount_kgs_real", {
    precision: 12,
    scale: 2,
  }).notNull(), // Сумма в KGS по реальному курсу
  amountKgsClient: decimal("amount_kgs_client", {
    precision: 12,
    scale: 2,
  }).notNull(), // Сумма в KGS по курсу клиента
  createdAt: timestamp("created_at").defaultNow(),
  notes: text("notes"),
});

// Баланс клиента (история операций)
export const balanceTransactions = pgTable("balance_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  type: text("type").notNull(), // deposit / order / shipping / commission / refund
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // В KGS
  referenceId: uuid("reference_id"), // ID заказа/отправки/операции
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export interface CurrencyItem {
  code: string;
  name: string;
}

// Пользователи (байеры) - для авторизации через Supabase Auth
// Supabase Auth хранит пользователей в своей таблице auth.users
// Здесь храним дополнительные данные
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(), // Совпадает с auth.users.id
  name: text("name").notNull(),
  role: text("role").notNull().default("buyer"), // admin / buyer
  currencies: jsonb("currencies")
    .$type<CurrencyItem[]>()
    .default([
      { code: "RUB", name: "Российский рубль" },
      { code: "KGS", name: "Киргизский сом" },
    ]),
  defaultCurrencyCode: text("default_currency_code").default("RUB"),
  createdAt: timestamp("created_at").defaultNow(),
});
