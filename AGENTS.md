# Buyer Lite — Agent Instructions

## Project

Accounting and order management system for a buyer working at Dordoi Market (Kyrgyzstan). A PWA application designed for mobile devices (Samsung).

**Primary user:** a 52-year-old buyer. The UI must be as simple and intuitive as possible.

## Technology Stack

| Technology          | Purpose                      |
| ------------------- | ---------------------------- |
| Next.js 16          | Framework (App Router)       |
| Supabase            | PostgreSQL database + Auth   |
| Drizzle ORM         | Database queries             |
| shadcn/ui           | UI components                |
| Tailwind CSS 4      | Styling                      |
| Zod                 | Validation                   |
| Zustand             | Client-side state management |
| react-hook-form     | Forms                        |
| @react-pdf/renderer | PDF reports                  |

## Project Structure

```text
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application pages
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn components
│   ├── forms/             # Forms
│   └── tables/            # Tables
├── lib/
│   ├── db/                # Drizzle schema and database connection
│   ├── supabase/          # Supabase clients
│   └── utils.ts
├── server/                # Server Actions
├── stores/                # Zustand stores
└── middleware.ts          # Auth middleware
```

## Database

**11 tables:**

* `currencies` — currencies (RUB, KGS, USD, EUR + custom currencies)
* `suppliers` — suppliers (market stalls at Dordoi)
* `item_types` — item categories
* `clients` — clients
* `orders` — supplier orders
* `order_items` — items within orders
* `shipments` — shipments (cargo deliveries)
* `shipment_items` — items within shipments
* `exchange_operations` — currency exchange operations
* `balance_transactions` — client balance history
* `user_profiles` — user profiles (buyers)

**Connection:** Transaction pooler via postgres.js

## Authentication

* **Supabase Auth** (email/password)
* Roles: `admin` (creates users), `buyer` (manages clients and orders)
* Middleware redirects to `/auth/login` if the user is not authenticated
* **Registration is disabled** — only admins can create users through the Admin API
* Display Name is stored in `user.user_metadata.display_name`

## Test Users

| Email                                       | Password | Role  | Display Name |
| ------------------------------------------- | -------- | ----- | ------------ |
| [test@buyer.lite](mailto:test@buyer.lite)   | 123      | admin | Test Buyer   |
| [buyer@buyer.lite](mailto:buyer@buyer.lite) | 123      | buyer | Buyer        |

## Key Business Rules

1. **Exchange spread** — the difference between the real exchange rate and the rate offered to the client (hidden margin)
2. **Product margin** — the difference between the purchase price and the client price
3. **Buyer commission** — 5% of the client-facing product price
4. **Currencies** — RUB and KGS are available by default; additional currencies can be created in Settings
5. **Product photos** — not used

## Documentation

* `docs/FLOW.md` — business process and user flows
* `docs/TECH.md` — technology stack and architecture
* `docs/TERMINOLOGY.md` — project terminology

## Skills

* `.agents/skills/supabase/` — Supabase best practices
* `.agents/skills/supabase-postgres-best-practices/` — PostgreSQL optimization guidelines

## Supabase Components (shadcn)

Installed via:

```bash
npx shadcn@latest add @supabase/...
```

Installed:

* `@supabase/password-based-auth-nextjs` — authentication components

Available for installation:

* `@supabase/current-user-avatar-nextjs` — user avatar
* `@supabase/dropzone-nextjs` — file uploads (Storage)

## Code Style

* Functional components
* Server Components by default; Client Components only when necessary
* TypeScript for type safety
* Zod for validation
* Forms with react-hook-form + @hookform/resolvers
* UI built with shadcn/ui + Tailwind CSS

## Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm db:generate      # Generate migrations
pnpm db:push          # Apply migrations
pnpm db:studio        # Drizzle Studio (database browser)
pnpm lint             # Code quality checks (Biome)
pnpm format           # Code formatting
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version contains breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Pay attention to deprecation notices.

<!-- END:nextjs-agent-rules -->
