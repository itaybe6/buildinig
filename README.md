# Property management monorepo

Monorepo for a property-management platform: **Next.js 14** web dashboard, **Expo (React Native)** mobile app, shared packages for Supabase types, validation, and UI primitives.

## Prerequisites

- **Node.js** 20.19+ (recommended for Expo SDK 54 / React Native 0.81)
- **pnpm** 9+ (`corepack enable` then `corepack prepare pnpm@9.12.0 --activate`)

## Install

From the repository root:

```bash
pnpm install
```

## Environment variables

| App | Copy | Variables |
|-----|------|-----------|
| Web | `apps/web/.env.example` → `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Mobile | `apps/mobile/.env.example` → `apps/mobile/.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

Never commit real secrets (`.env.local` / `.env` are gitignored).

## Supabase generated types

Types live in `packages/supabase/src/database.types.ts` and mirror your SQL schema. After changing the database, regenerate:

```bash
cd packages/supabase
# Link CLI: supabase login && link project
pnpm gen-types
```

On Windows, run the underlying command manually if `gen-types` fails (replace `PROJECT_REF`):

```bash
npx supabase gen types typescript --project-id PROJECT_REF --schema public > src/database.types.ts
```

## Development

```bash
# Web dashboard (default http://localhost:3000)
pnpm dev:web

# Mobile (Expo)
pnpm dev:mobile

# Both (parallel)
pnpm dev:all
```

After installing mobile deps for the first time, align native versions with Expo:

```bash
cd apps/mobile
npx expo install --fix
```

## Useful scripts (root)

| Command | Description |
|--------|-------------|
| `pnpm build` | Production build via Turborepo |
| `pnpm typecheck` | TypeScript across packages |
| `pnpm lint` | Lint (where configured) |

## Workspace layout

```
apps/
  web/          Next.js 14 App Router, RTL, TanStack Query, RHF + Zod login scaffold
  mobile/       Expo Router, NativeWind, RTL, role-based tabs (resident / employee)
packages/
  supabase/     Typed Database + browser / server / native Supabase clients
  shared/       Zod enums matching Postgres, entity aliases, Hebrew labels, date/currency utils
  ui-web/       Shared Radix-style primitives (Button, Card, Input, Label) for web + shadcn path
  ui-mobile/    Shared RN placeholders (StyleSheet-based for stable TS in the package)
```

## Roles (scaffold behaviour)

| Role | Web | Mobile |
|------|-----|--------|
| `super_admin` | Full nav including `/super-admin/*` | Sign-in shows alert: use web |
| `manager` | Manager sidebar routes | Same alert |
| `employee` | Reduced sidebar | Tabs: assignments, all-requests |
| `resident` | Redirect to `/unauthorized` | Tabs: home, requests, quotes, payments, announcements |

## Notes

- **RLS** must allow each role to read/write according to your policies; the scaffold does not implement business logic or data fetching beyond auth/profile checks.
- **shadcn/ui**: Web uses `@my-project/ui-web` with `/components/ui/*` re-exports and `components.json` so you can run `npx shadcn@latest add …` in `apps/web` and optionally move components into `packages/ui-web`.
- **NativeWind**: Mobile uses NativeWind v4 + `global.css`; if Metro fails, verify `nativewind/metro` matches your installed `nativewind` version.
