# Buyer Lite — Agent Instructions

## Проект

Система учёта для байера, работающего на Дордое (КР). PWA приложение для мобильных устройств (Samsung).

**Основной пользователь:** байер, 52 года. UI должен быть максимально простым и понятным.

## Технологии

| Технология | Назначение |
|------------|------------|
| Next.js 16 | Фреймворк (App Router) |
| Supabase | PostgreSQL база + Auth |
| Drizzle ORM | Запросы к БД |
| shadcn/ui | UI компоненты |
| Tailwind CSS 4 | Стили |
| Zod | Валидация |
| Zustand | Клиентский стейт |
| react-hook-form | Формы |
| @react-pdf/renderer | PDF отчёты |

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Страницы авторизации
│   ├── (dashboard)/       # Основные страницы
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn компоненты
│   ├── forms/             # Формы
│   └── tables/            # Таблицы
├── lib/
│   ├── db/                # Drizzle схема и подключение
│   ├── supabase/          # Supabase клиенты
│   └── utils.ts
├── server/                # Server Actions
├── stores/                # Zustand stores
└── middleware.ts           # Auth middleware
```

## База данных

**11 таблиц:**
- `currencies` — валюты (RUB, KGS, USD, EUR + кастомные)
- `suppliers` — поставщики (точки на Дордое)
- `item_types` — типы товаров
- `clients` — клиенты
- `orders` — заказы у поставщиков
- `order_items` — товары в заказе
- `shipments` — отправки (карго)
- `shipment_items` — товары в отправке
- `exchange_operations` — операции обмена валюты
- `balance_transactions` — история баланса клиентов
- `user_profiles` — профили пользователей (байеров)

**Подключение:** Transaction pooler через postgres.js

## Авторизация

- **Supabase Auth** (email/password)
- Роли: `admin` (создаёт пользователей), `buyer` (работает с клиентами)
- Middleware редиректит на `/login` если не авторизован

## Тестовые пользователи

| Email | Пароль | Роль | Display Name |
|-------|--------|------|---------------|
| test@buyer.lite | 123 | admin | Тестовый Байер |
| buyer@buyer.lite | 123 | buyer | Байер |

## Ключевые бизнес-правила

1. **Курсовой спред** — разница между реальным курсом и курсом для клиента (скрытая маржа)
2. **Товарная маржа** — разница между ценой закупки и ценой для клиента
3. **Комиссия байера** — 5% от цены товара для клиента
4. **Валюты** — по дефолту RUB + KGS, можно создать новые в настройках
5. **Фото товаров** — не используются

## Документация

- `docs/FLOW.md` — бизнес-процесс и флоу
- `docs/TECH.md` — технологии и архитектура
- `docs/TERMINOLOGY.md` — терминология

## Скилы

- `.agents/skills/supabase/` — лучшие практики Supabase
- `.agents/skills/supabase-postgres-best-practices/` — оптимизация PostgreSQL

## Стиль кода

- Функциональные компоненты
- Server Components по дефолту, Client только когда нужен
- Типизация через TypeScript
- Валидация через Zod
- Формы через react-hook-form + @hookform/resolvers
- UI через shadcn/ui + Tailwind

## Команды

```bash
pnpm dev              # Запуск dev сервера
pnpm build            # Билд для продакшена
pnpm db:generate      # Генерация миграций
pnpm db:push          # Применение миграций
pnpm db:studio        # Drizzle Studio (просмотр БД)
pnpm lint             # Проверка кода (Biome)
pnpm format           # Форматирование кода
```

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
