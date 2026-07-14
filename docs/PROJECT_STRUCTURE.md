# SevaBoard — Project Structure

This document explains what lives where in the repo. For architecture
decisions and the database schema, see [`PROJECT_LOG.md`](./PROJECT_LOG.md).
For the security model, see [`SECURITY.md`](./SECURITY.md).

## Root config files

| File | Purpose |
| --- | --- |
| `package.json` | Scripts (`dev`, `build`, `lint`, `preview`, `generate-icons`) and dependencies |
| `vite.config.ts` | React plugin, `@tailwindcss/vite`, `VitePWA` (manifest), `@` path alias |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | TypeScript config + `@/*` path alias |
| `eslint.config.js` | ESLint 9 flat config with React Hooks/Refresh rules |
| `components.json` | shadcn/ui CLI config (style `base-nova`, Base UI primitives) |
| `index.html` | Entry HTML — title, theme-color meta, PWA links, mounts `#root` |
| `.env` | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (gitignored) |
| `SUPABASE_SETUP.md` | Step-by-step Supabase project setup guide |
| `README.md` | Project overview, tech stack, setup instructions |

## `supabase/` — database & Edge Functions

- `schema.sql` — enums, all tables, triggers, RLS policies, Realtime publication
- `seed.sql` — starter departments + program rooms
- `migrations/` — incremental schema changes (run after `schema.sql`):
  - `001_budget_tba.sql` — nullable budget amounts
  - `002_program_planner.sql` — room columns/color, event column_name
  - `003_public_read.sql` — anonymous read access on all tables
  - `004_marketing_sponsors.sql` — marketing_items + sponsors tables
  - `005_sponsor_categories.sql` — sponsor_categories table (name + color)
  - `006_budget_forecasted.sql` — budget_entries.forecasted_amount column
  - `007_venue_photos.sql` — venue_photos table + `venue-photos` Storage bucket
  - `008_pii_restriction.sql` — tightens profiles/sponsors SELECT RLS + adds `profiles_public`/`sponsors_public` redacting views
- `functions/invite-member/index.ts` — Edge Function: admin sends invite email
- `functions/remove-member/index.ts` — Edge Function: admin deletes a user
- `functions/_shared/cors.ts` — shared CORS headers for Edge Functions

## `public/` & `scripts/`

- `public/favicon.svg`, `public/icon-maskable.svg` — source SVG icons
- `public/icons/` — generated PNGs (192, 512, maskable, apple-touch)
- `scripts/generate-icons.mjs` — `sharp` script to rasterize SVGs

## `src/` — application code

### Top level

- `main.tsx` — app entry: `ThemeProvider` → `QueryClientProvider` → `AuthProvider` → `BrowserRouter` → `App`
- `App.tsx` — route definitions (public pages, protected pages, demo mode)
- `index.css` — Tailwind v4 theme tokens (light + dark), Geist font
- `vite-env.d.ts` — TypeScript ambient types for Vite env vars

### `src/lib/` — core utilities

| File | Purpose |
| --- | --- |
| `supabase.ts` | Typed Supabase client from env vars |
| `queryClient.ts` | Shared TanStack Query `QueryClient` instance |
| `utils.ts` | `cn()` class merging + `getInitials()` |
| `navigation.ts` | `NAV_ITEMS` (9 modules), bottom nav splits, `requiresAuth` flags |

### `src/types/` — TypeScript types

- `database.ts` — hand-written types mirroring the SQL schema: 8 enums + `Database` object with `Row`/`Insert`/`Update` for all 14 tables, plus a `Views` map for the two PII-redacting views (`profiles_public`, `sponsors_public`)
- `index.ts` — friendly type aliases (`Profile`, `PlanningTask`, `Sponsor`, etc.), label constants (`ROLE_LABELS`, `STATUS_LABELS`, `MARKETING_PLATFORM_LABELS`, `SPONSOR_STATUS_LABELS`, `ASSIGNABLE_ROLES`)

### `src/contexts/` — React context

- `auth-context.ts` — `AuthContext` type + creation
- `AuthContext.tsx` — `AuthProvider`: session management + profile fetching via TanStack Query

### `src/hooks/` — data hooks

| Hook | Table | Purpose |
| --- | --- | --- |
| `useAuth.ts` | — | Consumes `AuthContext` |
| `useVenueDetails.ts` | `venue_details` | Singleton venue row |
| `useVenuePhotos.ts` | `venue_photos` | Venue map/layout gallery photos |
| `useProfiles.ts` | `profiles_public` view | All team members (email/phone redacted for anon) |
| `useDepartments.ts` | `departments` | All departments |
| `useRooms.ts` | `rooms` | Program planner rooms |
| `useProgramItems.ts` | `program_items` | Schedule events |
| `usePlanningTasks.ts` | `planning_tasks` | Timeline tasks |
| `useBudgetEntries.ts` | `budget_entries` | Finance entries |
| `useMarketingItems.ts` | `marketing_items` | Marketing activities |
| `useSponsors.ts` | `sponsors_public` view | Sponsor relationships (contact info redacted for non-admin/lead) |
| `useRosterEntries.ts` | `roster_entries` | Volunteer assignments |
| `useSponsorCategories.ts` | `sponsor_categories` | Sponsor category name→color mapping |
| `useIdleTimer.ts` | — | Inactivity detection |
| `useInviteMember.ts` | Edge Function | Invite member mutation |
| `useRemoveMember.ts` | Edge Function | Remove member mutation |

### `src/components/ui/` — shadcn/ui primitives

Generated components: `alert-dialog`, `avatar`, `badge`, `button`, `card`,
`dropdown-menu`, `field`, `input`, `label`, `select`, `separator`, `sheet`,
`skeleton`, `sonner`, `tabs`, `textarea`.

### `src/components/common/` — shared app components

| Component | Purpose |
| --- | --- |
| `ProtectedRoute.tsx` | Redirects to `/login` if not authenticated |
| `RoleGate.tsx` | Conditionally renders children by `profile.role` |
| `PageHeader.tsx` | Page title + description + optional action slot |
| `EmptyState.tsx` | Zero-data placeholder (icon + message) |
| `CountdownTimer.tsx` | Live countdown to event date |
| `IdleTimeoutDialog.tsx` | 30-min inactivity warning + auto sign-out |
| `ConfirmDialog.tsx` | Themed delete/confirm dialog (replaces `window.confirm`) |

### `src/components/layout/` — app shell

| Component | Purpose |
| --- | --- |
| `AppShell.tsx` | Main layout: Sidebar + Topbar + content + BottomNav + IdleTimeout |
| `Sidebar.tsx` | Desktop nav, theme toggle, demo button, account panel / login |
| `Topbar.tsx` | Mobile logo + desktop page title |
| `BottomNav.tsx` | Mobile tab bar with "More" sheet |
| `PageTransition.tsx` | Framer Motion fade/slide on route change |

### `src/pages/` — page components

| Route | Page | Status |
| --- | --- | --- |
| `/` | `DashboardPage` | Complete (countdown, upcoming tasks) |
| `/program-planner` | `ProgramPlannerPage` | Complete (time grid, room settings) |
| `/planning-timeline` | `PlanningTimelinePage` | Complete (drag-and-drop board) |
| `/marketing` | `MarketingPage` | Complete (activities, deadlines, filters) |
| `/seva-roster` | `SevaRosterPage` | Complete (grouped by role, time pickers) |
| `/finances` | `BudgetPage` | Complete (income/expense, TBA, filters) — **requires login** |
| `/sponsors` | `SponsorsPage` | Complete (relationship tracking, status pipeline, color-coded categories with counts) |
| `/venue-details` | `VenueDetailsPage` | Complete (view + edit, drag-to-reorder photo gallery) |
| `/team` | `TeamPage` | Complete (members, departments, invite/remove) — **requires login** |
| `/login` | `LoginPage` | Complete |
| `/set-password` | `SetPasswordPage` | Complete |
| `/demo/*` | Demo mode | Complete (all pages with sample data) |

### `src/pages/sponsors/` — sponsor module helpers

- `category-helpers.ts` — `SPONSOR_COLORS` (6 named color options with Tailwind dot/badge classes) + `fallbackCategoryColor()` (hash-based fallback for unrecognised category names)

### `src/pages/venue-details/` — venue module helpers

- `VenuePhotoGallery.tsx` — venue map/layout photo gallery: upload (Supabase Storage), delete, and drag-to-reorder (`@dnd-kit/sortable`) tiles with an optional label per photo

### `src/demo/` — demo mode

- `sample-data.ts` — hardcoded sample data for all tables
- `context.ts` — `DemoContext` + `useIsDemo()` hook
- `DemoProvider.tsx` — pre-seeded QueryClient + fake admin auth
- `DemoBanner.tsx` — "Demo Mode" banner with exit button
- `DemoShell.tsx` — layout wrapper for demo routes
- `useDemoGuard.ts` — mutation guard (prevents real DB writes in demo)

### `docs/` — documentation

- `PROJECT_LOG.md` — architecture decisions, schema summary, implementation log
- `PROJECT_STRUCTURE.md` — this file
- `SECURITY.md` — security model, RLS policies, audit findings
- `summary.md` — plain-language walkthrough of how the app runs end to end (React patterns used, data flow, how the database is put together)
