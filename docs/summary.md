# SevaBoard — How It All Fits Together

A plain-language walkthrough of how the site actually runs: what loads
first, what React patterns are used and why, and how data gets from the
database to the screen. For the file-by-file map see
[`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md); for architecture
decisions and history see [`PROJECT_LOG.md`](./PROJECT_LOG.md).

## 1. The big picture

SevaBoard is a **single-page app (SPA)**: the browser loads one HTML page
once, and everything after that — switching between Dashboard, Program
Planner, Finances, etc. — happens by JavaScript swapping content in and
out, without a full page reload. There's no traditional server rendering
pages per request.

Two halves:

- **Frontend**: React app, built with Vite, running entirely in the
  browser. This is "the website" — all UI, forms, and logic for deciding
  what to show live here.
- **Backend**: Supabase — a hosted Postgres database plus authentication,
  file/API access, and a couple of small serverless functions. The
  frontend talks to it over the network; there's no custom Node/Express
  server in between.

## 2. What loads first

`index.html` has a single `<div id="root">` and a script tag pulling in
`src/main.tsx`. That file is the true entry point:

```
main.tsx
  └─ ThemeProvider        (light/dark mode)
      └─ QueryClientProvider   (server-data cache, see §4)
          └─ AuthProvider      (who's logged in, see §5)
              └─ BrowserRouter (URL-based navigation)
                  └─ App.tsx   (route definitions)
```

Each of those is a **provider** — a component that wraps the whole app
and makes some piece of shared state (theme, cached data, logged-in user,
current URL) available to every component below it, without having to
pass it down manually through props at every level.

`App.tsx` then declares the actual routes (`/`, `/finances`,
`/program-planner`, etc.) using **React Router**, mapping each URL to a
page component. `/demo/*` is a parallel route tree that renders the same
page components but wrapped in a `DemoProvider` that fakes login and
serves hardcoded data instead of hitting Supabase — that's how `/demo`
works without a real account.

## 3. React concepts used, and what they're for

| Concept | What it means here | Where |
| --- | --- | --- |
| **Function components** | Every UI piece (a page, a card, a button) is just a function that returns JSX (HTML-like syntax in JS). No class components anywhere. | everywhere |
| **Hooks** (`useState`, `useMemo`, `useEffect`) | Built-in React functions for giving a component memory (state), avoiding recalculating things every render (`useMemo`), and reacting to changes. | e.g. filters/sort state in `BudgetPage.tsx` |
| **Context** | A way to share a value (like "who is logged in") with any component in the tree, without passing it through every intermediate component as a prop. | `AuthContext`, `DemoContext` |
| **Custom hooks** | Your own function starting with `use...` that wraps some reusable logic — usually a data fetch. | `useAuth()`, `useBudgetEntries()`, `useRooms()`, etc. — one per database table, in `src/hooks/` |
| **Controlled forms** | Input fields whose value is driven by React state (`useState`) rather than the raw DOM, so React always knows the current value. | every `*FormSheet.tsx` component |
| **Conditional rendering** | Showing/hiding UI based on a value — e.g. only rendering "Edit" buttons if the logged-in user is an admin. | `RoleGate` component, used all over |
| **Composition** | Building complex UI by nesting small, reusable pieces rather than one giant component. | `PageHeader`, `EmptyState`, shadcn `Card`/`Sheet`/`Select` primitives |

### The libraries doing the heavy lifting

- **TanStack Query** (`@tanstack/react-query`) — see §4, this is the most
  important one to understand.
- **React Router v7** — turns the URL into which page component renders;
  also handles redirects (e.g. `ProtectedRoute` sends you to `/login` if
  you're not signed in).
- **React Hook Form + Zod** — form state management + validation.
  Zod defines "what a valid submission looks like" (e.g. "amount must be
  a positive number"), React Hook Form wires that to the actual inputs.
  Note: in the sheets you've been looking at (`EntryFormSheet.tsx`,
  `RoomSettingsSheet.tsx`), validation is currently done by hand
  (`if (!amount) toast.error(...)`) rather than through RHF/Zod — that's
  a slightly older pattern in this codebase, not a hard rule.
- **Framer Motion** — the fade/slide animation when you switch pages
  (`PageTransition.tsx`).
- **shadcn/ui on Base UI** — not a component *library* you install as a
  black box; it's a CLI that generates the component source code
  directly into `src/components/ui/`, which you then own and can edit.
  Base UI provides the unstyled, accessible interaction logic (focus
  trapping, keyboard nav, etc.) underneath.
- **Tailwind CSS v4** — utility classes (`flex`, `rounded-lg`, `text-sm`)
  for styling directly in JSX, instead of separate CSS files. The design
  tokens (colors, etc.) are defined once in `src/index.css`.

## 4. How data gets from the database to the screen

This is the core loop, and it's the same shape for every module
(Budget, Sponsors, Roster, etc.):

```
Component renders
  → calls a custom hook, e.g. useBudgetEntries()
    → that hook calls useQuery() from TanStack Query
      → which calls supabase.from("budget_entries").select("*")
        → Supabase's PostgREST API translates that into SQL
          → Postgres runs the query, checking Row Level Security (§5)
        → data comes back as JSON
      → TanStack Query caches it under a "query key" (e.g. ["budget_entries"])
  → component re-renders with the data
```

The important part: **TanStack Query owns the cache**, not component
state. That means:

- If two different pages both call `useBudgetEntries()`, they share one
  cached copy instead of fetching twice.
- After a save/delete, the mutation calls
  `queryClient.invalidateQueries({ queryKey: ["budget_entries"] })`,
  which tells every component using that data "go re-fetch" — this is
  why the UI updates immediately after you edit something, with no
  manual state syncing.
- Loading/error states (`isLoading`, `isPending`) come for free from the
  hook, instead of being tracked by hand.

Every table in the database has a matching hook in `src/hooks/` following
this exact pattern — once you understand `useBudgetEntries.ts`, you
understand all of them.

## 5. How the database is put together

The backend is **Supabase**, which is really "managed Postgres plus some
extras," not a custom server you'd write yourself:

- **Postgres** is the actual database. The schema — every table, enum
  type, trigger, and access rule — is defined in plain SQL:
  [`supabase/schema.sql`](../supabase/schema.sql) is the original
  baseline, and [`supabase/migrations/`](../supabase/migrations) holds
  every incremental change made since (e.g. adding a column). You run
  these files against your Supabase project via its SQL editor; there's
  no ORM generating the schema from code.
- **Types are hand-written, not generated.** `src/types/database.ts` is a
  TypeScript file that manually mirrors the SQL schema (table columns,
  enum values) so that `supabase.from("budget_entries")` calls are
  type-checked and autocomplete-friendly in the editor. If the SQL schema
  changes, this file has to be updated by hand to match — there's no
  `supabase gen types` step wired up currently.
- **Row Level Security (RLS)** is what actually enforces "who can see/
  edit what" — not the frontend. Every table has RLS turned on, and
  Postgres itself checks a policy (a SQL `USING`/`WITH CHECK` clause) on
  every single query, regardless of what the app's UI does or doesn't
  show. Two helper SQL functions, `is_admin()` and `is_admin_or_lead()`,
  are reused across most policies. The frontend's `RoleGate` component
  (hiding buttons for non-admins) is just a UX nicety on top — even if
  someone bypassed the UI and called the API directly, RLS still blocks
  them. See [`SECURITY.md`](./SECURITY.md) for the full policy table.
- **Auth** is Supabase's built-in auth system: it issues a JWT (a signed
  token proving who you are) on login, stored in the browser, and every
  Supabase request automatically includes it so RLS policies can check
  `auth.uid()`. There's no separate login server or session database to
  manage.
- **Edge Functions** (`supabase/functions/invite-member`,
  `remove-member`) are small serverless functions (Deno runtime) that run
  *on Supabase's servers*, not in the browser. They exist specifically
  for the few actions that need the powerful "service role" key (e.g.
  creating/deleting a user account) — a key that must never reach the
  browser, so it only lives inside these functions.
- **Realtime** is a Postgres feature Supabase exposes: certain tables
  (`program_items`, `planning_tasks`, `roster_entries`, `budget_entries`)
  are published so connected clients *could* get pushed live updates
  when a row changes, instead of having to re-fetch. This is configured
  in the database but the frontend doesn't currently subscribe to it —
  it's set up for future use, not active yet.

## 6. Talking to Supabase from the frontend

One typed client, created once and imported everywhere:
[`src/lib/supabase.ts`](../src/lib/supabase.ts) reads two public env
variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and creates a
`supabase` client. The anon key is safe to expose in the browser — it
identifies the *project*, not a user; RLS is what actually gates access,
not the secrecy of this key. Every hook in `src/hooks/` imports this same
client.

## 7. Build & deploy

- **Vite** is the dev server and bundler — `npm run dev` starts a local
  server with instant hot-reload; `npm run build` runs a TypeScript check
  (`tsc -b`) then bundles everything into static files (`dist/`).
  Because it's a static SPA, the whole `dist/` folder can be hosted
  anywhere that serves static files — no Node server required at
  runtime. Vercel is the planned host.
- **PWA**: `vite-plugin-pwa` generates a manifest + service worker so the
  site can be "installed" on a phone/desktop and has an app icon, using
  icons generated from hand-drawn SVGs via `scripts/generate-icons.mjs`.

## 8. Putting it together: a concrete example

Editing a budget entry, end to end:

1. You click "Edit" on an `EntryCard` → sets local state, opens
   `EntryFormSheet` with that entry pre-filled.
2. You change the amount, click Save → `handleSubmit` runs your manual
   validation, then calls a `useMutation` (TanStack Query) function.
3. That function calls `supabase.from("budget_entries").update(...)`.
4. The request hits Supabase's API with your JWT attached; Postgres
   checks the `budget_entries_write` RLS policy (are you admin/lead?)
   before allowing the `UPDATE`.
5. On success, `queryClient.invalidateQueries({ queryKey: ["budget_entries"] })`
   runs, which makes every component reading that query key (the whole
   Finances page) automatically re-fetch and re-render with the new
   number — no manual "update this card's state" code needed anywhere.
