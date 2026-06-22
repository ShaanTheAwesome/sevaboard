# SevaBoard — Security Overview

This document is a snapshot of SevaBoard's security model: what protects
what, why the current design choices were made, and what's worth revisiting
as the app grows. It's written for whoever picks this project up next
(human or AI) so security decisions don't have to be re-derived from scratch.

**Scope / threat model**: SevaBoard is an internal tool for an event
organizing team (dozens of people, not the general public). Every
`authenticated` user is a vetted team member with an admin-created account.
The main risks are therefore: (1) a regular member doing something they
shouldn't (privilege escalation), (2) PII/financial data being more visible
than intended, and (3) the service-role key ever reaching the browser. There
is no public-facing attack surface beyond the login page and the
`invite-member` Edge Function.

## 1. Authentication

- **No public signup.** Accounts are created by admins (Supabase dashboard,
  or via the `invite-member` Edge Function — see §4). Public signups should
  be disabled in **Authentication → Settings** (documented in
  [`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md) §6) — worth re-confirming this
  is still off in the Supabase dashboard, since it's a dashboard setting and
  not enforced by anything in this repo.
- **Session handling** is entirely managed by `@supabase/supabase-js`
  (`src/lib/supabase.ts`) — JWT access token + refresh token, stored in the
  browser's `localStorage` by the SDK. The frontend never touches tokens
  directly (no manual `localStorage`/`document.cookie` access anywhere in
  `src/`).
- **Idle timeout** (`src/hooks/useIdleTimer.ts`,
  `src/components/common/IdleTimeoutDialog.tsx`): after 30 minutes of no
  mouse/keyboard/scroll/touch activity, the user gets a 60-second warning,
  then `signOut()` is called automatically. This is a client-side UX measure
  for shared/unattended devices — it doesn't shorten the underlying Supabase
  JWT/refresh token lifetime, which is configured separately in the Supabase
  dashboard (Authentication → Settings → Sessions).
- **`/set-password`** (`src/pages/auth/SetPasswordPage.tsx`) is a public
  route, but it's gated on having a live Supabase session: if
  `useAuth().user` is `null` it redirects to `/login`. A session here only
  exists if the user arrived via a valid Supabase invite/recovery link
  (which establishes a session client-side) or is already logged in and
  chose "Change password" from the account menu. There's no separate
  "current password" check before setting a new one — this matches Supabase's
  own `updateUser({ password })` semantics (a valid session is the
  credential).

## 2. Authorization (RBAC)

Enforced at **two layers**, and only one of them actually matters for
security:

1. **Postgres Row Level Security (source of truth)** — every table in
   [`supabase/schema.sql`](../supabase/schema.sql) has RLS enabled. Two
   `security definer` helper functions, `is_admin()` and
   `is_admin_or_lead()`, check the caller's role from `profiles` without
   recursive-RLS issues. Both are declared `set search_path = public`, which
   prevents a classic Postgres `security definer` privilege-escalation bug
   (a malicious `search_path` redefining `profiles` in another schema).
2. **UI guards** (`RoleGate`, conditional rendering) — purely cosmetic.
   Hiding the "Invite member" button from non-admins doesn't stop a
   non-admin from calling the underlying API directly; RLS does. This is
   correct and intentional, just worth remembering: **never add a feature
   that relies on `RoleGate` alone for access control.**

### Policy summary

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | any authenticated user (all columns, incl. email/phone) | self (own row, role/dept locked — see below) or admin |
| `departments`, `rooms`, `room_notes`, `program_items`, `design_items`, `roster_entries`, `venue_details` | any authenticated user | admin or team_lead |
| `planning_tasks` | any authenticated user | admin/team_lead (insert/delete); admin/team_lead **or** the assignee (update only) |
| `budget_entries` | any authenticated user | admin or team_lead |

- **`prevent_self_role_escalation`** trigger (defense in depth): even though
  `profiles_update_own_or_admin` lets a user update their own row, this
  `BEFORE UPDATE` trigger silently reverts `role`/`department_id` back to
  their old values unless the caller `is_admin()`. So even a crafted client
  request can't self-promote to admin.
- **`profiles_select` is `using (true)`** — every authenticated user
  (including `member`/`volunteer`) can read every other profile's
  `full_name`, `email`, `phone`, `role`, and `department_id`. This is a
  deliberate "everyone knows everyone" transparency choice for a small
  organizing team, but it does mean phone numbers and emails are
  org-wide-visible PII. Worth a conscious decision if the team grows or
  includes people who'd rather not share their phone number with every
  volunteer.
- **`budget_entries_select` is `using (true)`** — financial data
  (income/expenses, amounts, categories) is readable by every authenticated
  user, including `volunteer`. The `volunteer` role exists in the
  `user_role` enum but isn't yet differentiated from `member` in any policy
  (per `docs/PROJECT_LOG.md` §"Roles"), so right now a volunteer has the same
  read access as an admin for budget data. Flag this if/when `volunteer`
  gets a more restricted profile.

## 3. Frontend secrets & environment variables

- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are read by the app
  (`src/lib/supabase.ts`). Vite only inlines `VITE_`-prefixed env vars into
  the client bundle, so these are the *only* two values that ever ship to
  the browser. This is the standard, intended Supabase model — the anon key
  is safe to expose precisely because RLS (§2) is the real access control,
  not the key itself.
- The **service-role key is never referenced anywhere in `src/`** (confirmed
  by search) — it only exists as `SUPABASE_SERVICE_ROLE_KEY`, an
  auto-injected env var inside the `invite-member` Edge Function runtime
  (Deno, server-side only). There is no code path that could leak it to the
  browser.
- `.env` is gitignored (`.gitignore` lines 16-18) and is never read by the
  assistant per project convention (see `docs/PROJECT_LOG.md` header note).
  `SUPABASE_SETUP.md` references a `.env.example` template that doesn't
  currently exist in the repo — a minor onboarding-doc gap (not a security
  issue), worth adding so new contributors have a value-free template to
  copy.

## 4. `invite-member` Edge Function

[`supabase/functions/invite-member/index.ts`](../supabase/functions/invite-member/index.ts)
is the one place this app uses the service-role key, so it's the highest-value
target and gets the most scrutiny.

**Trust model**: the function never trusts the request until it has
independently verified the caller.

1. The caller's `Authorization` header (forwarded automatically by
   `supabase.functions.invoke`) is used to build a normal **anon-key**
   client scoped to that JWT.
2. `callerClient.auth.getUser()` round-trips to Supabase Auth to verify the
   token is valid and not expired/forged — this is the recommended pattern
   over locally decoding the JWT.
3. `callerClient.from("profiles").select("role")...` — subject to normal RLS
   (`profiles_select`, which is `using (true)`, so this always succeeds for
   any authenticated caller; the *role check* is the actual gate).
4. Only if `callerProfile.role === "admin"` does the function create a
   **service-role** client. Every failure path above returns `401`/`403`
   *before* the service-role client is constructed — there's no code path
   where a non-admin reaches privileged code.

**Input validation** (all server-side, before any privileged call):
email regex, `role` checked against a `VALID_ROLES` allow-list (so a caller
can't set an arbitrary string into the `user_role` enum), `department_id`
type-checked. An admin *can* invite another `admin` — intentional, since
admins are trusted to grant admin access.

**Redirect safety**: the invite email's `redirectTo` is built from the
`SITE_URL` secret, not from any value in the request — a caller can't
redirect the invite link to an attacker-controlled domain. Supabase also
enforces its own allow-list of redirect URLs (Authentication → URL
Configuration), so even a misconfigured `SITE_URL` would be rejected unless
it's also on that allow-list.

**CORS**: [`supabase/functions/_shared/cors.ts`](../supabase/functions/_shared/cors.ts)
sets `Access-Control-Allow-Origin: *`. This is intentional and safe *here*
because the function does its own auth/role check regardless of request
origin — CORS isn't the security boundary, the role check in step 4 above
is. (If this pattern is reused for a function that *doesn't* re-verify the
caller, this header would need to be revisited.)

**Residual / minor items**:
- No rate-limiting on invites beyond Supabase's own project-level email
  limits — a compromised admin account could be used to spam invite emails.
  Low impact (no data exposure, just noise), and the admin account being
  compromised is a bigger problem than this on its own.
- `inviteError?.message` is passed through to the client as-is. Currently
  this only surfaces Supabase Auth's own user-facing strings (e.g. "User
  already registered"). If this function is extended later, avoid passing
  raw Postgres/driver error messages through the same path — wrap new error
  sources in a generic message before returning them.

## 5. Client-side rendering & injection

- **No XSS sinks**: no `dangerouslySetInnerHTML`, `eval`, `new Function`, or
  direct `innerHTML`/`document.write` anywhere in `src/` (confirmed by
  search). All user-entered text (names, notes, descriptions, etc.) is
  rendered through normal JSX, which React escapes by default.
- **No SQL injection surface**: all data access goes through
  `@supabase/supabase-js`'s query builder (PostgREST under the hood) — no
  raw SQL string concatenation and no `.rpc()` calls anywhere in `src/`.
- **No Content-Security-Policy** is currently set (`index.html` has no CSP
  meta tag). Not required for current functionality, but would be a
  reasonable defense-in-depth addition if/when third-party scripts are ever
  introduced (analytics, etc.) — restricting `connect-src` to the Supabase
  project URL would limit where a future XSS could exfiltrate data to.

## 6. Realtime

`program_items`, `planning_tasks`, `roster_entries`, and `budget_entries`
are in the `supabase_realtime` publication. Supabase Realtime's
`postgres_changes` enforces the same RLS policies as REST reads for the
`authenticated` role — since all four tables already have `using (true)`
select policies, realtime doesn't expose anything that wasn't already
readable via a normal query.

## 7. Account lifecycle / offboarding

Member removal is handled via the `remove-member` Edge Function
([`supabase/functions/remove-member/index.ts`](../supabase/functions/remove-member/index.ts)),
which calls `auth.admin.deleteUser(userId)` using the service-role key.
This deletes the `auth.users` row, and the `on delete cascade` on
`profiles.id` automatically removes the corresponding `profiles` row —
so the person can no longer authenticate and their profile data is
cleaned up in one operation.

**Trust model**: identical to `invite-member` (§4) — the caller's JWT is
verified via `auth.getUser()`, their profile role is checked, and only
admins reach the privileged `deleteUser` call. An additional server-side
guard prevents an admin from deleting their own account.

The `profiles_delete_admin` RLS policy still exists but is **not called
by any UI path** — the remove-member button goes through the Edge
Function, not a direct `profiles` delete. The policy remains as a
fallback for SQL-editor use but should not be wired to any frontend
action (doing so would orphan the `auth.users` row).

## 8. Dependencies

`npm audit --omit=dev` reports **0 known vulnerabilities** (checked
2026-06-12). Re-run this periodically and especially before deploys —
`npm audit` (without `--omit=dev`) for the full picture including build
tooling.

## 9. Open items / recommendations

Roughly in priority order:

1. **Decide on `profiles` PII visibility** — confirm the team is OK with
   every member seeing every other member's email/phone (§2). If not,
   restrict `profiles_select` to a subset of columns via a view, or to
   admins/leads + self.
2. **Add `.env.example`** so `SUPABASE_SETUP.md`'s setup steps work as
   written for new contributors (§3).
3. **Double-check Supabase dashboard settings** that live outside this repo:
   public signups disabled, leaked-password protection enabled, refresh
   token reuse detection on (Authentication → Settings).
4. **Consider a CSP meta tag** as defense-in-depth (§5) — optional, no known
   gap it closes today.
5. **Decide what `volunteer` should and shouldn't see** before that role is
   actively assigned to anyone (§2) — right now it's identical to `member`.
