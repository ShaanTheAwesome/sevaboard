# SevaBoard — Security Overview

This document is a snapshot of SevaBoard's security model: what protects
what, why the current design choices were made, and what's worth revisiting
as the app grows.

**Scope / threat model**: SevaBoard is a publicly viewable event management
tool for an organizing team. The site is readable by anyone with the URL,
but only authenticated admins and team leads can modify data. The main
risks are: (1) unauthorized writes (someone modifying data without being an
admin/lead), (2) PII exposure beyond what's intended, and (3) the
service-role key ever reaching the browser.

## 1. Authentication

- **No public signup.** Accounts are created by admins via the
  `invite-member` Edge Function or the Supabase dashboard. Public signups
  should be disabled in **Authentication → Settings**.
- **Two roles with accounts**: `admin` and `team_lead`. The `member` and
  `volunteer` enum values still exist in the database but are no longer
  assignable from the UI — role selectors only offer Admin and Team Lead.
- **Session handling** is entirely managed by `@supabase/supabase-js`
  (`src/lib/supabase.ts`) — JWT access token + refresh token in
  `localStorage`. No manual token manipulation anywhere in `src/`.
- **Idle timeout** (`src/hooks/useIdleTimer.ts`): after 30 minutes of
  inactivity, auto sign-out. Only active when logged in — anonymous
  viewers are not affected.
- **`/set-password`** is a public route gated on a live session (only
  reachable via invite link or while already logged in).

## 2. Authorization (RBAC)

Enforced at **two layers**:

1. **Postgres Row Level Security (source of truth)** — every table has RLS
   enabled. `is_admin()` and `is_admin_or_lead()` helper functions
   (`security definer`, `set search_path = public`) check the caller's role.
2. **UI guards** (`RoleGate`, conditional rendering) — purely cosmetic.
   RLS is what actually enforces access.

### Policy summary

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | anon + authenticated | self (role/dept locked by trigger) or admin |
| `departments`, `rooms`, `room_notes`, `program_items`, `roster_entries`, `venue_details` | anon + authenticated | admin or team_lead |
| `planning_tasks` | anon + authenticated | admin/team_lead (insert/delete); admin/team_lead **or** assignee (update) |
| `budget_entries` | anon + authenticated | admin or team_lead |
| `marketing_items` | anon + authenticated | admin or team_lead |
| `sponsors` | anon + authenticated | admin or team_lead |
| `venue_photos` (table + `venue-photos` Storage bucket) | anon + authenticated | admin or team_lead |

- **`prevent_self_role_escalation`** trigger: silently reverts `role`/
  `department_id` changes on own profile unless `is_admin()`.
- **Anonymous reads**: all SELECT policies grant access to `anon` + `authenticated`
  (migration `003_public_read.sql`). The site is publicly viewable.
- **Private pages**: Finances (`/finances`) and Team & Roles (`/team`) are
  hidden from the sidebar for non-logged-in users and wrapped in
  `ProtectedRoute` (redirects to `/login`). However, the underlying RLS
  still allows anonymous reads on `profiles` and `budget_entries` via the
  API — the privacy is enforced at the **UI routing level**, not RLS.
  This is acceptable for the current threat model (the URL isn't public,
  and the data isn't highly sensitive).

### PII visibility

- **Profiles**: anonymous visitors see name and role only (email/phone
  hidden by the UI). Logged-in admins see all fields.
- **Sponsors**: anonymous visitors see company name and status only.
  Contact details, amount, person responsible, and notes are admin-only
  in the UI.
- **Note**: the RLS SELECT policies on `profiles` and `sponsors` return
  all columns to any reader (including `anon`). The PII filtering is done
  in the React components, not in the database. A technically sophisticated
  person could query the API directly to see email/phone. For a small
  community team this is acceptable; for a larger deployment, consider
  column-level restrictions via a Postgres view.

## 3. Frontend secrets & environment variables

- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` ship to the
  browser. The anon key is safe to expose — RLS is the access control.
- The **service-role key** only exists in the Edge Functions runtime
  (`invite-member`, `remove-member`). Confirmed by grep: zero references
  in `src/`.
- `.env` is gitignored.
- **Storage uploads** (`venue-photos` bucket) go through the same anon key
  + RLS model as everything else — Storage policies on `storage.objects`
  (scoped to `bucket_id = 'venue-photos'`) restrict insert/update/delete to
  `is_admin_or_lead()`, so no elevated key is needed for the browser to
  upload directly.

## 4. Edge Functions

### `invite-member`

[`supabase/functions/invite-member/index.ts`](../supabase/functions/invite-member/index.ts)

Trust model: verifies caller JWT via `auth.getUser()`, checks admin role
via RLS-protected profile query, only then creates a service-role client
to send the invite. Input validated server-side (email regex, role
allow-list, department_id type check). Redirect URL built from `SITE_URL`
secret, not from request.

### `remove-member`

[`supabase/functions/remove-member/index.ts`](../supabase/functions/remove-member/index.ts)

Same trust model. Calls `auth.admin.deleteUser(userId)` which cascades to
`profiles` via `ON DELETE CASCADE`. Server-side guard prevents
self-deletion.

### CORS

Both functions use `Access-Control-Allow-Origin: *` — safe because each
function enforces its own auth/role check internally.

## 5. Client-side rendering & injection

- **No XSS sinks**: no `dangerouslySetInnerHTML`, `eval`, `new Function`,
  or `innerHTML` anywhere in `src/`.
- **No SQL injection surface**: all data access via the Supabase query
  builder (PostgREST). No `.rpc()` calls.
- **No CSP** meta tag — optional defense-in-depth, not required currently.

## 6. Demo mode

`/demo/*` routes use pre-seeded TanStack Query cache with hardcoded sample
data. All mutations are guarded by `useDemoGuard` — they show a toast
instead of calling Supabase. The `ConfirmDialog` also checks `useIsDemo()`
to prevent delete operations.

**No real data is exposed or modified in demo mode.** The demo uses a fake
admin auth context (not a real Supabase session), so even if the guards
failed, the mutations would lack valid credentials.

## 7. Account lifecycle / offboarding

Member removal via `remove-member` Edge Function: deletes `auth.users`
row → cascades to `profiles`. The `profiles_delete_admin` RLS policy
exists but is not called by any frontend path.

## 8. Realtime

`program_items`, `planning_tasks`, `roster_entries`, and `budget_entries`
are in the `supabase_realtime` publication. The frontend does **not**
currently subscribe to realtime events — this is configured in the DB
but not yet implemented in the UI. When implemented, Supabase Realtime
respects RLS for the `authenticated` role.

## 9. Dependencies

`npm audit --omit=dev` reports **0 known vulnerabilities** (checked
2026-06-29). Re-run periodically and before deploys.

## 10. Open items / recommendations

1. **Column-level PII restriction** — currently the UI hides email/phone
   from anonymous visitors, but the API still returns them. Consider a
   Postgres view that restricts columns for `anon` role if the site URL
   becomes more widely shared.
2. **Planning tasks RLS** — the `planning_tasks_update` policy allows
   assignees to update any column (not just `status`). The UI only shows
   a status toggle, but a direct API call could change other fields.
   Low risk for the current team, fixable with a trigger if needed.
3. **Double-check Supabase dashboard settings**: public signups disabled,
   leaked-password protection enabled, refresh token reuse detection on.
4. **Consider a CSP meta tag** as defense-in-depth.
