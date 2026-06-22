# Supabase Setup Guide

SevaBoard uses [Supabase](https://supabase.com) for authentication, the
Postgres database, and realtime sync. Follow these steps once to set up a
new project.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an
   account).
2. Click **New project**.
3. Choose an organization, give the project a name (e.g. `sevaboard`), set a
   strong database password (save it somewhere safe), and pick a region
   close to your users.
4. Wait for the project to finish provisioning (a couple of minutes).

## 2. Copy your API credentials

1. In the Supabase dashboard, go to **Settings → API**.
2. Copy the **Project URL** and the **`anon` `public`** API key.
3. In the SevaBoard project root, copy `.env.example` to `.env`:

   ```sh
   cp .env.example .env
   ```

4. Fill in the values:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

`.env` is already gitignored — never commit your real credentials.

## 3. Run the database schema

1. In the Supabase dashboard, go to **SQL Editor**.
2. Click **New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
   This creates all enums, tables, triggers, RLS policies, and adds the
   realtime publication entries.
3. Run a second query with the contents of
   [`supabase/seed.sql`](supabase/seed.sql) to insert the starter
   departments and program rooms.

## 4. Confirm Realtime is enabled

`schema.sql` already adds `program_items`, `planning_tasks`,
`roster_entries`, and `budget_entries` to the `supabase_realtime`
publication via SQL. To double-check (or manage this via the UI instead):

1. Go to **Database → Replication**.
2. Open the `supabase_realtime` publication and confirm those four tables
   are toggled on.

## 5. Create your first user (and make them an Admin)

SevaBoard has no public signup form — accounts are admin-controlled.

1. Go to **Authentication → Users** and click **Add user → Create new
   user**.
2. Enter an email and password for yourself, and check **Auto Confirm
   User** so you can log in immediately.
3. A matching row is automatically created in `public.profiles` with the
   default role `member`. Promote yourself to `admin` by running this in
   the **SQL Editor** (replace the email):

   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```

4. (Optional) Set your display name:

   ```sql
   update profiles set full_name = 'Your Name' where email = 'you@example.com';
   ```

You can repeat step 1 to create accounts for other team members, then
update their `role` and `department_id` from the SQL editor for now (a
Team & Roles admin UI is planned for a later module).

## 6. (Optional) Disable public signups

Since accounts are created by admins only, you can turn off self-signup:

1. Go to **Authentication → Settings**.
2. Under **User Signups**, disable **Allow new users to sign up**.

## 7. Deploy Edge Functions

The Team & Roles page lets admins **invite** and **remove** members
directly from the website. These operations are powered by Supabase Edge
Functions that run with the service-role key — that key never reaches
the browser.

- [`supabase/functions/invite-member`](supabase/functions/invite-member) —
  sends an invitation email and creates the new user's profile.
- [`supabase/functions/remove-member`](supabase/functions/remove-member) —
  deletes the user's `auth.users` row (which cascades to `profiles`),
  fully revoking their access.

1. Install the Supabase CLI and log in (one-time):

   ```sh
   npx supabase login
   ```

2. Link this project to your Supabase project (replace `your-project-ref`,
   found in **Settings → General → Reference ID**):

   ```sh
   npx supabase link --project-ref your-project-ref
   ```

3. Set the `SITE_URL` secret to the URL where the app is hosted (use
   `http://localhost:5173` for local dev, or your production URL once
   deployed — re-run this after deploying to production):

   ```sh
   npx supabase secrets set SITE_URL=http://localhost:5173
   ```

4. Deploy both functions:

   ```sh
   npx supabase functions deploy invite-member
   npx supabase functions deploy remove-member
   ```

5. Allow the invite link's redirect in **Authentication → URL
   Configuration → Redirect URLs**. Add:

   ```
   http://localhost:5173/set-password
   ```

   (and the equivalent `https://your-production-url/set-password` once
   deployed).

Only users with `role = 'admin'` in `profiles` can call these
functions — each one checks the caller's role itself before doing
anything, so the service-role key stays protected even though the
function endpoints are public.

## 8. Run the app

```sh
npm install
npm run dev
```

Log in at `/login` with the account you created in step 5.
