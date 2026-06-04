# Buyer Lite — Технологии и архитектура

## Стек технологий

### Уже есть (в package.json)

| Технология | Версия | Назначение |
|------------|--------|------------|
| Next.js | 16.2.7 | Фреймворк (App Router, Server Actions) |
| React | 19.2.4 | UI |
| Tailwind CSS | 4 | Стили |
| shadcn/ui | 4.10.0 | UI-компоненты |
| Zod | 4.4.3 | Валидация |
| Zustand | 5.0.14 | Клиентский стейт |
| Biome | 2.2.0 | Линтер и форматтер |

---

## Рекомендации по добавлению

### 🗄️ База данных: Supabase (PostgreSQL) + Drizzle ORM

**Выбрано: Supabase + Vercel**

- Supabase — бесплатный PostgreSQL, не засыпает
- Vercel — бесплатный хостинг Next.js, не засыпает
- Итого: $0/мес, оба сервиса always-on

**Почему Supabase:**
- Бесплатный тариф: 500MB хранилища, always-on
- Встроенный Auth (можно не использовать NextAuth)
- Удобный Dashboard для просмотра данных
- Много примеров и туториалов для Next.js
- PostgreSQL — индустриальный стандарт

**Почему Drizzle ORM:**
- Современный, типобезопасный
- Отлично работает с Next.js App Router
- SQL-like API (легко понять)
- Миграции через drizzle-kit
- Маленький размер
- Хорошая поддержка Supabase/PostgreSQL

```
pnpm add drizzle-orm @supabase/supabase-js
pnpm add -D drizzle-kit postgres @types/postgres
```

**Или через Supabase JS client (без Drizzle):**
```
pnpm add @supabase/supabase-js @supabase/ssr
```

**Структура БД:**

```sql
-- Пользователи (байеры)
users
├── id (uuid)
├── name
├── email
├── password_hash
├── role (admin / buyer)
└── created_at

-- Валюты
currencies
├── id (uuid)
├── code (RUB, KGS, USD, EUR)
├── name (Российский рубль, Киргизский сом)
├── symbol (₽, с, $, €)
└── is_default (boolean)

-- Клиенты
clients
├── id (uuid)
├── name
├── phone
├── telegram
├── city (город доставки)
├── default_currency_id → currencies (по дефолту RUB)
├── notes
└── created_at

-- Поставщики (точки на Дордое)
suppliers
├── id (uuid)
├── name (Айлин, Дина и т.д.)
├── location (опционально)
└── notes

-- Типы товаров
item_types
├── id (uuid)
├── name (блузка, юбка, платье, штаны)
└── created_at

-- Заказы (от поставщика)
orders
├── id (uuid)
├── client_id → clients
├── supplier_id → suppliers
├── status (planned / purchased / ready / shipped)
├── created_at
└── updated_at

-- Товары в заказе
order_items
├── id (uuid)
├── order_id → orders
├── item_type_id → item_types
├── external_id (ID у поставщика)
├── quantity
├── purchase_price (реальная цена в KGS)
├── client_price (цена для клиента в KGS)
├── name (опционально)
├── size (опционально)
├── color (опционально)
└── notes

Примечание: фото товаров не используются (нет загрузки изображений)

-- Отправки (карго)
shipments
├── id (uuid)
├── client_id → clients
├── status (preparing / shipped / delivered)
├── destination (куда едет)
├── shipping_cost (стоимость доставки в KGS)
├── notes (что на мешке)
├── created_at
└── shipped_at

-- Товары в отправке (связь с order_items)
shipment_items
├── id (uuid)
├── shipment_id → shipments
├── order_item_id → order_items
└── quantity (может быть часть заказа)

-- Операции обмена валюты
exchange_operations
├── id (uuid)
├── client_id → clients
├── amount_foreign (сумма в валюте клиента)
├── currency (RUB, USD и т.д.)
├── rate_real (реальный курс)
├── rate_client (курс для клиента)
├── amount_kgs_real (сумма в KGS по реальному курсу)
├── amount_kgs_client (сумма в KGS по курсу клиента)
├── created_at
└── notes

-- Баланс клиента (история операций)
balance_transactions
├── id (uuid)
├── client_id → clients
├── type (deposit / order / shipping / commission / refund)
├── amount (в KGS)
├── reference_id (ID заказа/отправки/операции)
├── description
└── created_at
```

---

### 🔐 Аутентификация: Supabase Auth

**Выбрано: Supabase Auth (вместо NextAuth)**

**Почему Supabase Auth:**
- Встроен в Supabase, не нужна отдельная библиотека
- Email/password из коробки
- Row Level Security (RLS) — защита данных на уровне БД
- Удобный Dashboard для управления пользователями
- Бесплатно на бесплатном тарифе

**Роли:**
- `admin` — может создавать/удалять пользователей (через Dashboard или кастомную логику)
- `buyer` — основная роль, работает с клиентами и заказами

**Настройка:**
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

---

### 📄 PDF-отчёты: @react-pdf/renderer

**Почему:**
- Легковесный (не нужен headless browser как Puppeteer)
- Генерация PDF на клиенте или сервере
- Хорош для простых документов
- Не нагружает сервер

**Альтернатива: Puppeteer**
- Если нужен pixel-perfect результат
- Если отчёт сложный с графиками
- Тяжелее, но гибче

**Рекомендация:** начать с `@react-pdf/renderer`, при необходимости перейти на Puppeteer.

```
pnpm add @react-pdf/renderer
```

**Что в отчёте (PDF):**
- Шапка: имя клиента, дата отчёта
- Таблица товаров: тип, количество, цена за шт, итого
- Доставка
- Комиссия (5%)
- Общая сумма
- **Без:** реального курса, реальной цены закупки

---

### 📱 PWA: next-pwa

**Почему:**
- Samsung может сохранить PWA на главный экран
- Работает как нативное приложение
- Не нужен Play Store / App Store
- next-pwa — простая интеграция с Next.js

```
pnpm add next-pwa
```

**Что нужно:**
- `manifest.json` с иконками
- Service Worker для кэширования
- Иконки 192x192 и 512x512

---

### 📅 Даты: date-fns

**Почему:**
- Легковесный (tree-shakeable)
- Хорошая локализация (ru locale)
- Импорт только нужных функций

```
pnpm add date-fns
```

---

### 📋 Формы: react-hook-form

**Почему:**
- Маленький размер
- Хорошая производительность (минимум ре-рендеров)
- Интеграция с Zod через @hookform/resolvers
- Идеально для форм создания заказов/отправок

```
pnpm add react-hook-form @hookform/resolvers
```

---

### 🎯 Итоговый package.json (добавить)

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.x",
    "@react-pdf/renderer": "^4.x",
    "@supabase/ssr": "^0.5.x",
    "@supabase/supabase-js": "^2.x",
    "date-fns": "^3.x",
    "drizzle-orm": "^0.35.x",
    "next-pwa": "^5.x",
    "postgres": "^3.x",
    "react-hook-form": "^7.x"
  },
  "devDependencies": {
    "@types/postgres": "^3.x",
    "drizzle-kit": "^0.25.x"
  }
}
```

**Убрано:**
- `next-auth` — заменён на Supabase Auth
- `better-sqlite3` — заменён на `postgres` (для Supabase)
- `@types/better-sqlite3` — не нужен

---

## Supabase Setup

### 1. Создать проект
1. Зайти на [supabase.com](https://supabase.com)
2. Создать бесплатный проект
3. Сохранить `Project URL` и `anon key`

### 2. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
```

### 3. Auth (через Supabase)
Supabase Auth заменяет NextAuth:
- Email/password
- Magic Link (если нужно)
- Встроенные таблицы пользователей
- Row Level Security (RLS) для защиты данных

### 4. Drizzle + Supabase
```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
```

---

## Архитектура приложения

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/ (опционально, если нужна регистрация)
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (главная — dashboard)
│   │   ├── clients/
│   │   │   ├── page.tsx (список клиентов)
│   │   │   └── [id]/
│   │   │       └── page.tsx (детали клиента)
│   │   ├── orders/
│   │   │   ├── page.tsx (список заказов)
│   │   │   └── new/
│   │   │       └── page.tsx (новый заказ)
│   │   ├── shipments/
│   │   │   ├── page.tsx (список отправок)
│   │   │   └── new/
│   │   │       └── page.tsx (новая отправка)
│   │   ├── reports/
│   │   │   └── [clientId]/
│   │   │       └── page.tsx (генерация отчёта)
│   │   └── settings/
│   │       └── page.tsx (поставщики, типы товаров, валюты)
│   ├── api/
│   │   └── ... (если нужны API routes)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn)
│   ├── forms/
│   ├── tables/
│   └── reports/
├── lib/
│   ├── supabase/
│   │   ├── server.ts (серверный клиент)
│   │   ├── client.ts (клиентский клиент)
│   │   └── middleware.ts (обновление сессий)
│   ├── db/
│   │   ├── schema.ts (Drizzle схема)
│   │   ├── migrations/
│   │   └── index.ts (подключение)
│   ├── utils.ts
│   └── pdf/ (шаблоны PDF)
├── server/
│   ├── clients.ts (Server Actions)
│   ├── orders.ts
│   ├── shipments.ts
│   └── reports.ts
├── stores/ (Zustand)
├── types/
└── middleware.ts (Supabase Auth middleware, редирект на /login)
```

---

## План реализации

### Фаза 1: База и авторизация
- [ ] Создать проект Supabase
- [ ] Настроить Drizzle + Supabase (PostgreSQL)
- [ ] Создать схему БД
- [ ] Настроить Supabase Auth (email/password)
- [ ] Страница логина
- [ ] Админ-панель (создание пользователей через Supabase Dashboard или кастомную)

### Фаза 2: Клиенты
- [ ] Список клиентов
- [ ] Детали клиента (баланс, история)
- [ ] Операции обмена валюты
- [ ] Баланс клиента
- [ ] Настройки: управление валютами (создание новых)

### Фаза 3: Заказы
- [ ] Создание заказа у поставщика
- [ ] Список заказов по статусам
- [ ] Отметка "закуплен"
- [ ] Товарная маржа

### Фаза 4: Отправки
- [ ] Создание отправки
- [ ] Выбор товаров из заказов
- [ ] Стоимость доставки
- [ ] Статусы отправок

### Фаза 5: Отчёты
- [ ] PDF-генерация
- [ ] Отображение только нужной информации
- [ ] Скачивание / ссылка на PDF

### Фаза 6: PWA + полировка
- [ ] manifest.json
- [ ] Service Worker
- [ ] Иконки
- [ ] Тест на Samsung

---

## Вопросы для обсуждения

1. **Уведомления** — нужно ли оповещать о статусах? (push/email)
2. **Экспорт данных** — нужен ли CSV/Excel экспорт помимо PDF?
3. **История изменений** — нужно ли логировать кто и когда менял данные?

---

## Советы для вайбкодинга

1. **Документация рядом** — держи `docs/FLOW.md` открытым, чтобы AI понимал контекст
2. **Одна задача за раз** — не проси "сделай всё", а "сделай страницу логина"
3. **Показывай ошибки** — если что-то не работает, копируй ошибку в чат
4. **Проси объяснить** — если непонятно, что сделал AI, попроси объяснить
5. **Коммить часто** — после каждого рабочего блока делай git commit
6. **Проверяй UI** — после каждого изменения смотри в браузере
7. **Не бойся переделывать** — если не нравится, можно переделать

**Промпт-шаблон для вайбкодинга:**
```
Сделай [страницу/компонент] для [что делает].
Используй [технологию].
Данные из [таблица].
Поля: [список полей].
Страница должна: [описание].
UI: [описание стиля].
```
