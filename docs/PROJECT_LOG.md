# SevaBoard — Project Log

This is the living context document for SevaBoard. It covers what the
project is, the architecture decisions behind it, the database schema, and a
running log of what has been built so far. Read this first when picking the
project back up in a new session.

> **Note for AI assistants:** Never read or open `.env` (it contains real
> Supabase credentials). If something env-related needs debugging, ask the
> user to confirm values/format themselves instead of reading the file.
>
> Also: before any tool call that reaches outside this project folder (e.g.
> the user's home directory, AppData, global caches, installing software),
> explain in one sentence *why* it's needed before making the call.

## 1. Project Overview

SevaBoard is a full-stack PWA for managing a large Hindu community event —
initially Krishna Janmashtami with 1000+ attendees. It replaces scattered
spreadsheets/group chats with a single shared dashboard for the organizing
team.

### Modules (8)

1. **Dashboard** — overview, countdown to the event, quick links to every
   module.
2. **Program Planner** — schedule of activities across physical rooms (High
   Energy, Bhakti, Corridor).
3. **Planning Timeline** — week-by-week (week 16 → 0) prep task tracker by
   category and assignee.
4. **Design List** — posters/social media graphics with status, platform,
   and post dates.
5. **Seva Roster** — volunteer service roles, time slots, and locations.
6. **Budget & Spending** — income/expense entries, categories, totals.
7. **Venue Details** — address, event date/time, map link, parking notes.
8. **Team & Roles** — members, departments, role assignments.

### Roles (RBAC)

- **Admin** — full access everywhere.
- **Team Lead** — can create/edit/delete content in most modules.
- **Member** — read access everywhere; can update status on planning tasks
  assigned to them.
- **Volunteer** — planned for a future pass; not yet wired into RLS beyond
  existing as an enum value.

### Tech Stack

- **Frontend**: React 19 + Vite + TypeScript (strict)
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` config), shadcn/ui v4.11
  on **Base UI** primitives (style: `base-nova`), Geist Variable font
- **Routing**: React Router v7
- **Server state**: TanStack Query, synced with Supabase Realtime
- **Forms**: React Hook Form + Zod, shadcn `field.tsx` primitives (no
  `FormField`/`FormProvider` in this shadcn version — wired up manually)
- **Charts**: Recharts (Budget module, not yet built)
- **Animation**: Framer Motion (page transitions)
- **Backend**: Supabase (Auth, Postgres, Row Level Security, Realtime)
- **PWA**: vite-plugin-pwa, custom flame/diya icon set generated via `sharp`
- **Hosting**: Vercel (planned)

## 2. Architecture Decisions

### Accounts & Auth

- **Admin-controlled accounts** — there is no public signup form. Admins
  create users via the Supabase Auth dashboard (see
  [`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md)). A `handle_new_user()` trigger
  auto-creates a matching `profiles` row (default role `member`, no
  department) for every new `auth.users` row.
- `AuthContext` (`src/contexts/AuthContext.tsx`) manages the Supabase
  session and fetches the user's `profiles` row via TanStack Query. It
  exposes `{ user, profile, loading, signOut }` through `useAuth()`.
- `ProtectedRoute` redirects to `/login` when there's no session.
- `RoleGate` conditionally renders UI based on `profile.role` — used when
  building per-module CRUD controls.

### RBAC enforcement

Enforced at **two layers**:

1. **Postgres RLS** (source of truth) — every table has RLS enabled. Two
   `security definer` helper functions, `is_admin()` and
   `is_admin_or_lead()`, check the caller's role from `profiles` without
   triggering recursive RLS evaluation.
   - All tables: `SELECT` open to any authenticated user (transparency).
   - Most tables: `INSERT`/`UPDATE`/`DELETE` restricted to
     `is_admin_or_lead()`.
   - `planning_tasks`: members can also `UPDATE` (e.g. mark status) on tasks
     where `assigned_to = auth.uid()`.
   - `profiles`: a user can update their own row, but a `BEFORE UPDATE`
     trigger (`prevent_self_role_escalation`) silently reverts any change to
     `role`/`department_id` unless the caller is an admin.
2. **UI guards** (`RoleGate`, conditional rendering) — hide controls the
   user isn't allowed to use, as a UX nicety. RLS is what actually enforces
   access.

### Departments

Fixed starter list, seeded once: Budget, Design, Program, Seva, Hospitality,
Marketing, Logistics. Editable later via a Team & Roles admin UI (not built
yet). `departments.lead_id` points at the `profiles` row of that
department's Team Lead.

### Design system

Dark-only theme defined in `src/index.css` via Tailwind v4 `@theme`:

- Background: deep navy (`#0b0f1a`), foreground off-white (`#f5f3ee`)
- Primary/accent: saffron (`#ff9933`) and gold (`#ffd700`) — exposed as
  `--color-saffron` / `--color-gold` (usable as `bg-saffron`, `text-gold`,
  etc.)
- shadcn semantic tokens (`card`, `border`, `muted`, `sidebar*`, `chart-*`)
  all mapped onto this palette
- `:root` and `.dark` carry identical values since dark is the only theme —
  `<html class="dark">` is set in `index.html`

### PWA

`vite-plugin-pwa` with `registerType: 'autoUpdate'`. Manifest: name
"SevaBoard", `theme_color: #ff9933`, `background_color: #0b0f1a`,
`display: standalone`. Icons (192, 512, 512 maskable, 180 apple-touch) are
generated from hand-drawn SVGs (`public/favicon.svg`,
`public/icon-maskable.svg`) via `scripts/generate-icons.mjs`
(`npm run generate-icons`, uses `sharp`).

## 3. Database Schema Summary

See [`supabase/schema.sql`](../supabase/schema.sql) for the full source of
truth. Run [`supabase/seed.sql`](../supabase/seed.sql) afterward.

### Enums

- `user_role`: admin, team_lead, member, volunteer
- `task_status`: not_started, in_progress, done
- `design_status`: not_started, in_progress, done, approved
- `design_platform`: irl, digital
- `budget_type`: income, expense

### Tables

| Table | Purpose |
| --- | --- |
| `departments` | Org structure; `lead_id` → `profiles` |
| `profiles` | One row per `auth.users`; role, department, contact info |
| `rooms` | Program Planner rooms (High Energy, Bhakti, Corridor) |
| `program_items` | Scheduled activities per room |
| `room_notes` | One freeform note per room |
| `planning_tasks` | Week 0–16 prep tasks |
| `design_items` | Poster/social media design tracker |
| `roster_entries` | Seva (volunteer) shift assignments |
| `budget_entries` | Income/expense line items |
| `venue_details` | Single-row table (`id = 1`) for venue/event info |

### Realtime

`program_items`, `planning_tasks`, `roster_entries`, and `budget_entries`
are added to the `supabase_realtime` publication for live sync across
devices.

## 4. Future Considerations (not built yet)

### Multi-tenancy / self-serve organizations

The user may eventually want a self-serve flow: anyone can sign up, which
creates a new "project"/organization with them as its admin, and they can
invite others into it. **Nothing has been built for this yet** — current
schema is single-tenant (one global set of departments, profiles, etc.).

If/when this is pursued, the main implications are:

- Add an `organizations` (or `projects`) table, plus `organization_id` /
  `project_id` columns on `departments`, `profiles`, and every
  module table.
- `profiles` would need an org-membership model (a user could belong to
  multiple orgs) rather than a single global role — likely a separate
  `memberships` table (`user_id`, `organization_id`, `role`).
- RLS policies would change from "any authenticated user" /
  `is_admin_or_lead()` to "any member of this organization" /
  "admin/lead **of this organization**" — `is_admin()` /
  `is_admin_or_lead()` would need an `organization_id` parameter or rely on
  a `current_organization_id()` helper (e.g., from a JWT claim or session
  setting).
- Auth signup flow would change from admin-only (Supabase dashboard) to a
  public signup form that also creates the organization + membership row in
  one transaction (likely via a Postgres function or Edge Function).
- The frontend would need an org-switcher and org-scoped routing
  (`/o/:orgId/...` or similar) if a user can belong to multiple orgs.

This is documented so it isn't lost, but no schema changes have been made to
accommodate it — the current single-tenant design keeps v1 simple per the
user's request.

## 5. Implementation Log

### Session 1 — Scaffold

- Installed full dependency set (routing, data, forms, UI, PWA, dev tooling)
- Configured Tailwind v4 + `@tailwindcss/vite`, `@` path alias
  (`tsconfig.json` / `tsconfig.app.json` / `vite.config.ts`)
- Ran `shadcn@latest init` (style `base-nova`, Base UI primitives, neutral
  base color) and added: `button`, `card`, `input`, `label`, `avatar`,
  `dropdown-menu`, `separator`, `badge`, `sonner`, `skeleton`, `tabs`,
  `sheet`, `field`, `textarea`, `select`
- Built the SevaBoard design system in `src/index.css` (navy/saffron/gold
  palette, dark-only)
- Configured `vite-plugin-pwa`, generated custom flame/diya PWA icon set via
  `scripts/generate-icons.mjs`
- Wrote `src/types/database.ts` (hand-written types mirroring the schema)
  and `src/types/index.ts` (re-exports + `ROLE_LABELS`)
- Wrote `src/lib/supabase.ts` (typed client), `src/lib/queryClient.ts`,
  `.env.example`, `src/vite-env.d.ts`
- Wrote `supabase/schema.sql` (enums, 10 tables, triggers, RLS policies,
  realtime publication), `supabase/seed.sql` (departments + rooms), and
  [`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md)
- Built auth: `AuthContext`/`useAuth`, `ProtectedRoute`, `RoleGate`,
  `LoginPage` (React Hook Form + Zod, shadcn `field.tsx` primitives)
- Built app shell: `Sidebar` (desktop nav + user/logout), `Topbar` (page
  title + account menu), `BottomNav` (mobile tabs + "More" sheet),
  `PageTransition` (Framer Motion), `AppShell`
- Wired up routing in `App.tsx` and providers in `main.tsx`
  (`QueryClientProvider`, `AuthProvider`, `BrowserRouter`, `Toaster`)
- Built `DashboardPage` (countdown reading `venue_details`, 8-module nav
  grid) and empty-state placeholder pages for the other 7 modules
- Removed default Vite template cruft (`App.css`, `src/assets`, demo
  markup)

### Next steps (Session 1)

- ~~Manual: follow `SUPABASE_SETUP.md` to create a Supabase project, run the
  schema/seed SQL, and create the first admin user~~ — **done**
- ~~Build out each module fully~~ — **done** (all modules complete as of
  Session 5)

### Session 2 — Venue Details module

- Added `src/hooks/useVenueDetails.ts` — shared TanStack Query hook
  (`queryKey: ["venue_details"]`, fetches the singleton `id = 1` row).
  `CountdownTimer` now uses this same hook/query key, so saving changes on
  the Venue Details page immediately updates the Dashboard countdown via
  query invalidation.
- Added an optional `action` slot to `PageHeader` (renders top-right of the
  title) — a small reusable addition every module page will need for
  "Add"/"Edit" buttons.
- Built out `VenueDetailsPage`:
  - **View mode** (all authenticated users): cards for Event (name, date,
    time), Location (address, "Open in Maps" link), and Notes
    (parking/other), plus a "Last updated" timestamp.
  - **Edit mode** (`admin`/`team_lead` only, via `RoleGate` + enforced by
    the existing `venue_details_write` RLS policy): a form (React Hook Form
    + Zod) covering all fields, submitted via a TanStack Query mutation that
    updates the `id = 1` row (`updated_by` set to the current user; `set_updated_at`
    trigger handles `updated_at`).
  - Date/time stored as Postgres `date`/`time`, edited via native
    `<input type="date">` / `<input type="time">`.

### Session 3 — Team & Roles, idle timeout, light/dark theming

- **Team & Roles module** — fully built out from its placeholder page:
  - `TeamPage` — tabbed layout (Members / Departments) using shadcn `Tabs`.
  - **Members tab**: lists all profiles via `useProfiles` hook. Admins see an
    "Edit" button on each row; edit mode (inline in `MemberRow`) lets an
    admin change a member's full name, phone, role (select from all
    `user_role` values), and department (select from all departments + "No
    department"). Role/department changes are enforced server-side by the
    `prevent_self_role_escalation` trigger + RLS.
  - **Departments tab**: `DepartmentCard` grid showing name, description,
    lead (resolved from `profiles`), and member count. Admin/team_lead can
    add, edit (via `DepartmentFormSheet` — a slide-over `Sheet` with name,
    description, lead select), and delete departments (with
    `window.confirm`).
  - Added `useDepartments` hook (TanStack Query, `queryKey: ["departments"]`)
    and `useProfiles` hook (`queryKey: ["profiles"]`).
- **Reusable `EmptyState` component** (`src/components/common/EmptyState.tsx`)
  — icon + title + description card, used as the zero-data state in the
  Members and Departments tabs.
- **Idle timeout** — automatic sign-out after inactivity:
  - `useIdleTimer` hook (`src/hooks/useIdleTimer.ts`) — listens for
    mousemove, keydown, scroll, and touchstart events (1 s throttle) to
    track activity.
  - `IdleTimeoutDialog` (`src/components/common/IdleTimeoutDialog.tsx`) —
    after 30 minutes of no activity, shows an `AlertDialog` with a
    countdown (60 s); calls `signOut()` if the user doesn't dismiss it.
  - Added shadcn `alert-dialog` component.
- **Light/dark theming**:
  - Installed `next-themes` and wrapped the app in `ThemeProvider`
    (`main.tsx`) with `defaultTheme="dark"`.
  - Added a theme toggle button (Sun/Moon icon) in the `Sidebar` using
    `useTheme()`.
  - Added light-mode CSS variable overrides in `src/index.css` under `:root`
    (the dark values remain under `.dark`), so both themes have full palette
    coverage.

### Session 4 — Invite member, remove member, contrast fix, security audit

- **Light-mode contrast fix**: changed `:root` `--saffron` from `#c2660a`
  to `#a8530a` (~4.94:1 contrast ratio, passes WCAG AA) to improve
  readability of saffron-colored text on the light background.
- **Invite member feature** — admins can invite new members from the
  Team & Roles Members tab:
  - `supabase/functions/invite-member/index.ts` — Supabase Edge Function
    (Deno) that verifies the caller is an admin, validates input, then
    uses the service-role key to call `auth.admin.inviteUserByEmail()`.
    The invite email's `redirectTo` points to `/set-password` (built from
    the `SITE_URL` secret, not from the request).
  - `useInviteMember` hook + `InviteMemberSheet` component — UI for
    entering email, full name, role, and department.
  - `SetPasswordPage` (`/set-password`) — public route gated on a live
    Supabase session (only reachable via an invite/recovery link or while
    already logged in). React Hook Form + Zod, calls
    `supabase.auth.updateUser({ password })`.
  - "Change password" menu item added to `Topbar` account dropdown.
  - Deployment documented in `SUPABASE_SETUP.md` §7.
- **Remove member feature** — admins can remove members from the
  Team & Roles Members tab:
  - `supabase/functions/remove-member/index.ts` — Edge Function that
    verifies admin role, then calls `auth.admin.deleteUser(userId)`. The
    `on delete cascade` from `auth.users` → `profiles` cleans up the
    profile row automatically. Server-side guard prevents self-deletion.
  - `useRemoveMember` hook + trash icon button in `MemberRow` (admin-only,
    hidden for your own row). Confirmation prompt before deletion.
  - Deployment documented in `SUPABASE_SETUP.md` §7.
- **Security audit** — `docs/SECURITY.md`: comprehensive review of
  authentication, RBAC/RLS, frontend secrets, Edge Function trust model,
  client-side injection (none found), Realtime permissions, account
  lifecycle, dependencies (`npm audit` clean), and a prioritized list of
  open items/recommendations.
- **Account panel rework** — replaced the broken `DropdownMenu` (Base UI
  modal backdrop was blocking the entire page) with an inline expandable
  panel in the `Sidebar`:
  - Clicking the user area at the bottom of the sidebar toggles an
    in-sidebar panel showing full name, email, role, "Change password",
    and "Sign out". Chevron arrow indicates open/closed state.
  - `Topbar` stripped down to logo (mobile) + page title (desktop) only —
    no more avatar/dropdown.
  - `BottomNav` "More" sheet now includes "Change password" for mobile
    users.
### Session 5 — All modules built, public access, demo mode

- **Planning Timeline** — drag-and-drop week-by-week bulletin board:
  - 17 week columns (16 → 0) in a horizontally-scrollable board.
  - Auto-calculates current week from event date, auto-scrolls to it,
    and tags it with a "Now" badge.
  - Task cards with description, category badge, clickable status toggle
    (cycles Not Started → In Progress → Done), and assignee.
  - Drag and drop between week columns to reassign weeks.
  - Filter bar: category, status, assignee. Category chip picker in the
    add/edit form with autocomplete from existing categories.
  - Dashboard "Upcoming Tasks" widget shows current-week tasks.
  - Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

- **Budget & Spending → renamed to Finances**:
  - Summary cards: Total Income, Total Expenses, Balance, Pending (TBA).
  - Two-column layout: Income (left) + Expenses (right), stacked on
    mobile. Each column has its own subtotal and "Add" button.
  - Filters: category, type (income/expense), sort (newest/oldest/
    highest/lowest). Category chip picker in the form.
  - TBA support: toggle on the form sets amount to null. TBA entries
    show a saffron badge and are excluded from totals. A "Pending" card
    appears in the summary when TBA entries exist.
  - Migration: `001_budget_tba.sql` (amount nullable).

- **Program Planner** — time-grid schedule:
  - Side-by-side room columns with configurable sub-columns (e.g. High
    Energy has "Event" + "Stage", CM Room + Bhakti has "Half 1" +
    "Half 2"). Each room has a distinct color accent.
  - 15-minute time slots from 2:00 PM to 6:00 PM. Events span their
    correct number of rows. Click an empty cell to add, click an event
    to edit.
  - Room Settings sheet: add/edit/delete rooms, configure columns and
    colors.
  - Migration: `002_program_planner.sql` (rooms: columns + color;
    program_items: column_name).

- **Marketing** (new module, replaced Design List):
  - Activity cards: title, description, platform badge (Social Media /
    Print / Banner / Video / Website / Other), deadline (highlights
    overdue in red), status, assignee, notes.
  - Filters: status, platform.
  - New `marketing_items` table + `marketing_platform` / `marketing_status`
    enums.

- **Sponsors** (new module):
  - Full relationship tracking: company name, category, contact name,
    phone, amount (or TBA), status pipeline (Lead → Pending → Confirmed
    → Received), person responsible, notes.
  - Summary bar: confirmed total, pending count, total sponsors.
  - Contact details only visible to logged-in admins/leads.
  - New `sponsors` table + `sponsor_status` enum.
  - Migration: `004_marketing_sponsors.sql`.

- **Seva Roster** — volunteer shift assignments:
  - Entries grouped by role (e.g. "Stage Manager", "Kitchen Lead") with
    count badges.
  - Each card: role, person name, time slot (formatted as
    "2:00 PM – 4:00 PM"), location, notes.
  - Two native time pickers (start/end) in the form, consistent display
    format.
  - Role and location chip pickers in the form.
  - Filters: role, location.

- **Public access model** — site is now publicly viewable:
  - All pages except Finances and Team & Roles are accessible without
    login. `ProtectedRoute` wraps only those two.
  - RLS SELECT policies changed from `TO authenticated` to
    `TO anon, authenticated` on all tables.
  - Migration: `003_public_read.sql`.
  - Sidebar shows "Log in" button for unauthenticated visitors.
  - Nav items with `requiresAuth: true` hidden from logged-out users.
  - Team & Roles: public visitors see name + role only (no email/phone).
  - Idle timeout only active when logged in.
  - Roles simplified: only Admin and Team Lead are assignable. Member /
    Volunteer enum values remain in DB but are not shown in UI selectors.

- **Themed confirm dialogs** — replaced all `window.confirm()` calls with
  a reusable `ConfirmDialog` component using shadcn `AlertDialog`. Dimmed
  backdrop, styled card, Cancel/Delete buttons. Used in: MemberRow,
  DepartmentCard, TaskCard, EntryCard, MarketingCard, SponsorCard,
  RosterCard, EventFormSheet.

- **Sheet scrolling fix** — all form sheets now have a scrollable body
  with pinned header and footer (Save/Cancel always visible).

- **Demo mode** (`/demo`):
  - Separate route tree with hardcoded sample data for all 9 modules.
  - Pre-seeded TanStack Query cache with `staleTime: Infinity`, fake
    admin auth context. No Supabase calls in demo mode.
  - All forms and buttons are interactive but guarded — clicking Save
    shows "Demo mode — changes aren't saved" instead of hitting the DB.
  - Saffron "Demo Template" button in the sidebar. Demo banner at the
    top with centered text and "Exit demo" outline button.
  - Files: `src/demo/` (sample-data, context, DemoProvider, DemoBanner,
    DemoShell, useDemoGuard).

- **All modules are now complete.** Remaining optional work: realtime
  subscriptions, budget charts, and documentation updates.

### Session 6 — UX polish: Program Planner layout, Sponsor categories, Planning Timeline defaults, email invite template

- **Program Planner — room card separation** (`src/pages/program-planner/ScheduleGrid.tsx`):
  - Rooms were rendering as a continuous flat strip. Added `gap-3` on the
    outer flex container so rooms visually separate.
  - Each room `<div>` now has `rounded-lg border border-border overflow-hidden`,
    giving each room a distinct card boundary.
  - Removed the `border-r` on room headers (the outer card border replaces it).
  - Sub-column internal dividers softened from `border-border` to `border-border/50`.
  - `minWidth` calculation updated to account for gap pixels:
    `80 + totalColumns * 150 + rooms.length * 12`.

- **Sponsor categories — color-coded with per-category counts**:
  - **New migration** `supabase/migrations/005_sponsor_categories.sql`:
    creates `sponsor_categories(id, name text UNIQUE, color text DEFAULT 'blue',
    created_at)`. RLS: anon + authenticated SELECT; admin/lead INSERT/UPDATE/DELETE.
  - **New types**: `sponsor_categories` table entry added to `src/types/database.ts`;
    `SponsorCategory` re-exported from `src/types/index.ts`.
  - **New hook** `src/hooks/useSponsorCategories.ts`: TanStack Query hook that
    fetches all sponsor categories ordered by name (`queryKey: ["sponsor_categories"]`).
  - **New helper** `src/pages/sponsors/category-helpers.ts`: exports `SPONSOR_COLORS`
    (6 named color options with dot/badge CSS classes) and `fallbackCategoryColor()`
    (hash-based color for categories not yet in the DB table).
  - **`SponsorFormSheet.tsx`** (rewritten): category field replaced with:
    - Colored chip buttons for each known category (click to select/deselect).
    - A plain chip with an ×-clear for any unrecognised legacy category value.
    - "New category" inline form (name input + circular color dot picker +
      Add/Cancel), identical UX pattern to Program Planner's room color picker.
    - `createCatMutation` inserts into `sponsor_categories`, then selects and
      sets the new category.
  - **`SponsorsPage.tsx`** (rewritten): replaced hardcoded `CATEGORY_PALETTE`
    with a `getCategoryColor` useMemo that builds a Map from the DB query,
    with hash-based fallback. Summary bar now shows **per-category count pills**
    (e.g. "Food 2") coloured with `getCategoryColor`, in addition to the
    existing confirmed/pending/total figures.
  - **Demo mode**: `DEMO_SPONSOR_CATEGORIES` added to `src/demo/sample-data.ts`
    (Food/amber, Decorations/emerald, General/blue); pre-seeded in
    `DemoProvider.tsx` under `queryKey: ["sponsor_categories"]`.

- **Planning Timeline — task form defaults to current week** (`src/pages/planning-timeline/TaskFormSheet.tsx`):
  - New tasks now default `weekNumber` to the current week (computed from
    `venueDetails.event_date`) instead of hardcoded 16.
  - Added `useVenueDetails` import and a `currentWeek` useMemo using
    `differenceInCalendarDays` from `date-fns`:
    `Math.min(16, Math.floor(daysLeft / 7))`. Falls back to 16 if no event
    date is set.
  - TanStack Query returns cached `venueDetails` synchronously on first
    render, so no `useEffect` is needed — the `useState` initializer receives
    the correct value.

- **Supabase invite email template**: provided a custom HTML email template
  for Supabase Authentication → Email Templates → Invite User. Matches
  SevaBoard branding (saffron `#FF9933`, dark navy header, CTA button, plain
  fallback link). User pastes this directly into the Supabase dashboard —
  no code change in this repo.

### Pending / not yet implemented

- **Program Planner end-time default**: when clicking an empty cell to add
  an event, end time should auto-set to start + 15 minutes (currently
  defaults to a hardcoded value regardless of start time). Not yet done.
- **Marketing external link**: friend built a Vercel.app marketing schedule
  page; a hyperlink/button should be added to the Marketing module. Waiting
  for the URL.
- **Finances — forecasted budget**: friend requested a forecasted budget
  figure from their Google Sheets. Still being clarified.
