 # SevaBoard — Project Structure

This document explains what lives where in the repo, which files belong to
which part of the tech stack, and what is functional vs. placeholder as of
the current scaffold. For architecture decisions and the database schema,
see [`PROJECT_LOG.md`](./PROJECT_LOG.md).

## Root config files

| File | Tech | Purpose |
| --- | --- | --- |
| `package.json` | npm | Scripts (`dev`, `build`, `lint`, `preview`, `generate-icons`) and the full dependency list (React 19, Vite 8, Supabase JS, TanStack Query, RHF+Zod, Tailwind v4, shadcn/Base UI, Framer Motion, Recharts, date-fns, vite-plugin-pwa, sharp) |
| `vite.config.ts` | Vite | Registers the React plugin, `@tailwindcss/vite`, and `VitePWA` (manifest config — name, theme colors, icons). Also sets the `@` → `./src` path alias |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | TypeScript | Project references + strict compiler options + the `@/*` path alias mirrored from `vite.config.ts` |
| `eslint.config.js` | ESLint 9 flat config | Base JS/TS/React Hooks/React Refresh rules, plus an override disabling `react-refresh/only-export-components` for `src/components/ui/**` (shadcn files export `cva()` variants alongside components) |
| `components.json` | shadcn/ui | shadcn CLI config — style `base-nova`, Base UI primitives, path aliases for future `npx shadcn add ...` |
| `index.html` | Vite/PWA | Entry HTML — title, theme-color meta, favicon/apple-touch-icon links, mounts `#root` |
| `.env` / `.env.example` | Supabase | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. `.env` is gitignored and currently holds **placeholder** values so the app boots locally — replace with real values per `SUPABASE_SETUP.md` |
| `SUPABASE_SETUP.md` | Supabase | Step-by-step guide: create project → run `schema.sql`/`seed.sql` → enable Realtime → create first admin user |
| `docs/PROJECT_LOG.md` | — | Living context doc: architecture decisions, schema summary, future multi-tenancy notes, implementation log |

## `supabase/` — database

- `schema.sql` — enums, all 10 tables, triggers (`handle_new_user`,
  `sync_user_email`, `prevent_self_role_escalation`, `set_updated_at`), RLS
  helper functions (`is_admin()`, `is_admin_or_lead()`), full RLS policy set,
  Realtime publication entries
- `seed.sql` — 7 starter departments + 3 program rooms (High Energy, Bhakti,
  Corridor)

This is the source of truth for the Postgres schema; nothing here runs
automatically — you paste it into the Supabase SQL editor per
`SUPABASE_SETUP.md`.

## `public/` & `scripts/` — PWA assets

- `public/favicon.svg`, `public/icon-maskable.svg` — hand-drawn source icons
  (flame/diya, saffron-on-navy)
- `public/icons/` — generated PNGs (192, 512, 512 maskable, apple-touch-icon)
- `scripts/generate-icons.mjs` — one-off `sharp` script
  (`npm run generate-icons`) that rasterizes the SVGs into the PNGs above

## `src/` top level

- `main.tsx` — app entry. Wraps everything in `QueryClientProvider` →
  `AuthProvider` → `BrowserRouter` → `<App />`, plus a global
  `<Toaster theme="dark" />`
- `App.tsx` — all route definitions (see "Routing map" below)
- `index.css` — Tailwind v4 entry (`@import "tailwindcss"`), the SevaBoard
  `@theme` design tokens (navy background `#0b0f1a`, saffron `#ff9933`, gold
  `#ffd700`, shadcn semantic tokens), dark-only theme
- `vite-env.d.ts` — Vite/TS ambient types (incl. `import.meta.env` typings
  for the Supabase env vars)

## `src/lib/` — core utilities (general infra)

| File | Tech | Purpose |
| --- | --- | --- |
| `lib/supabase.ts` | Supabase | Creates the typed `supabase` client from `Database` types + env vars; throws a clear error if `.env` is missing values |
| `lib/queryClient.ts` | TanStack Query | The shared `QueryClient` instance used app-wide |
| `lib/utils.ts` | shadcn | The `cn()` class-merging helper (`clsx` + `tailwind-merge`) used by every UI component |
| `lib/navigation.ts` | App nav | `NAV_ITEMS` (the 8 modules: label, route, icon, description) and the bottom-nav split (`BOTTOM_NAV_PRIMARY` = Dashboard/Program Planner/Planning Timeline/Budget, `BOTTOM_NAV_MORE` = the rest) — single source of truth for both `Sidebar` and `BottomNav` |

## `src/types/` — TypeScript types (database tech stack)

- `types/database.ts` — hand-written types mirroring `schema.sql`: the 5
  enums (`UserRole`, `TaskStatus`, `DesignStatus`, `DesignPlatform`,
  `BudgetType`) and a `Database` object with `Row`/`Insert`/`Update` shapes
  for all 10 tables — this is what makes `supabase.from("...")` calls
  type-safe. Can later be replaced by `npx supabase gen types typescript`
- `types/index.ts` — re-exports the row types as friendly aliases
  (`Profile`, `ProgramItem`, `BudgetEntry`, etc.) and `ROLE_LABELS` (role enum
  → display string, used in Sidebar/Topbar)

## `src/contexts/` & `src/hooks/` — auth state (Supabase Auth tech stack)

- `contexts/auth-context.ts` — just the `AuthContext` object +
  `AuthContextValue` type (`{ user, profile, loading, signOut }`), split out
  to satisfy the React Refresh lint rule
- `contexts/AuthContext.tsx` — `AuthProvider`. Subscribes to
  `supabase.auth.getSession()`/`onAuthStateChange`, then uses TanStack Query
  to fetch the matching `profiles` row (role, department, name)
- `hooks/useAuth.ts` — `useAuth()` — the hook every component uses to read
  `{ user, profile, loading, signOut }`

**Current functionality**: real session handling once Supabase is
configured — login persists, profile (role) is fetched, sign-out works
everywhere.

## `src/components/ui/` — shadcn/ui primitives (Base UI tech stack)

Generated components, not hand-written: `avatar`, `badge`, `button`, `card`,
`dropdown-menu`, `field`, `input`, `label`, `select`, `separator`, `sheet`,
`skeleton`, `sonner`, `tabs`, `textarea`. These are the building blocks every
page/layout component composes. `field.tsx` is notable — it's the React Hook
Form–friendly wrapper set (`Field`, `FieldLabel`, `FieldError`, `FieldGroup`)
used in `LoginPage` and future module forms.

## `src/components/common/` — shared app components

| File | Used for | Functionality |
| --- | --- | --- |
| `ProtectedRoute.tsx` | Routing/auth | Shows a saffron spinner while session loads; redirects to `/login` if no user; otherwise renders `<Outlet />` |
| `RoleGate.tsx` | RBAC (UI layer) | `<RoleGate allow={["admin","team_lead"]}>...</RoleGate>` — renders children only if `profile.role` matches. Not used yet (no module CRUD built), but ready for module work |
| `PageHeader.tsx` | Every page | Consistent `<h1>` title + optional description, used at the top of all 8 module pages |
| `EmptyState.tsx` | Placeholder pages | Centered card with icon + title + description ("This module is coming soon") |
| `CountdownTimer.tsx` | Dashboard | Live countdown (days/hours/min/sec) to `venue_details.event_date`/`event_time`, fetched via TanStack Query, ticking every second. Shows a "set the event date" prompt if not configured yet |

## `src/components/layout/` — app shell & navigation (React Router + Framer Motion tech stack)

| File | Functionality |
| --- | --- |
| `Sidebar.tsx` | Desktop-only (`md:flex`) left nav — logo, the 8 module links with active-state highlighting, user avatar/name/role + sign-out button at the bottom |
| `Topbar.tsx` | Sticky top bar — mobile shows the SevaBoard logo/name; desktop shows the current page title; right side has an account dropdown (name, role, sign out) |
| `BottomNav.tsx` | Mobile-only (`md:hidden`) tab bar — 4 primary modules + a "More" button opening a bottom `Sheet` with the remaining 4 modules and sign-out |
| `PageTransition.tsx` | Wraps the route `<Outlet />` in Framer Motion `AnimatePresence`/`motion.div` for a fade+slide transition on navigation |
| `AppShell.tsx` | Combines all of the above into the authenticated layout: `Sidebar` + (`Topbar` + scrollable `<main>` with `PageTransition`) + `BottomNav` |

## `src/pages/` — route components

- `pages/auth/LoginPage.tsx` — **fully functional**: RHF + Zod validated
  email/password form, calls `supabase.auth.signInWithPassword`, shows inline
  errors, redirects to `/` on success. No signup link (admin-controlled
  accounts)
- `pages/dashboard/DashboardPage.tsx` — **partially built**: greeting using
  the user's first name, `<CountdownTimer />`, and an 8-card grid linking to
  every module
- The remaining 7 — `program-planner`, `planning-timeline`, `design-list`,
  `seva-roster`, `budget`, `venue-details`, `team` — are all
  **placeholders**: `PageHeader` + `EmptyState` only, no data fetching yet

## Routing map (`src/App.tsx`)

```
/login                    → LoginPage (public)
/  (everything else)      → ProtectedRoute → AppShell →
  /                        DashboardPage
  /program-planner         ProgramPlannerPage   (placeholder)
  /planning-timeline        PlanningTimelinePage (placeholder)
  /design-list               DesignListPage       (placeholder)
  /seva-roster                SevaRosterPage       (placeholder)
  /budget                      BudgetPage           (placeholder)
  /venue-details                VenueDetailsPage     (placeholder)
  /team                          TeamPage             (placeholder)
* (anything unmatched)    → redirect to /
```

## Where things stand

- **Working**: login/logout, session + role loading, full responsive nav
  (sidebar/topbar/bottom tabs), page transitions, dark navy/saffron/gold
  theme, PWA manifest/icons, dashboard countdown + module grid, complete DB
  schema + RLS ready to deploy
- **Not yet built**: all CRUD/data for the 7 non-dashboard modules —
  `Database`/types and RLS are ready for them, but no queries/mutations or
  forms exist yet beyond the placeholders
- **Manual step outstanding**: real Supabase project + `.env` values
  (currently placeholders) per `SUPABASE_SETUP.md`
