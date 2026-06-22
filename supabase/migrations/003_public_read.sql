-- Allow anonymous (non-authenticated) users to read all tables.
-- Run this in the Supabase SQL Editor after the previous migrations.
--
-- IMPORTANT: After running this, also enable anonymous access in your
-- Supabase dashboard: Authentication → Settings → Anonymous Sign-ins → Enable.
-- Without this, the anon key won't create a session and RLS will block reads.

-- profiles: anonymous can only see name and role (no email/phone).
-- We replace the existing SELECT policy with two: one for authenticated (full),
-- one for anon (restricted via a view would be ideal, but simpler to keep the
-- policy and hide PII in the frontend — the RLS still allows reading the row,
-- but the UI only shows name+role for non-logged-in users).
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO anon, authenticated USING (true);

-- All other tables: allow anon reads
DROP POLICY IF EXISTS "departments_select" ON departments;
CREATE POLICY "departments_select" ON departments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "rooms_select" ON rooms;
CREATE POLICY "rooms_select" ON rooms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "room_notes_select" ON room_notes;
CREATE POLICY "room_notes_select" ON room_notes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "program_items_select" ON program_items;
CREATE POLICY "program_items_select" ON program_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "planning_tasks_select" ON planning_tasks;
CREATE POLICY "planning_tasks_select" ON planning_tasks FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "design_items_select" ON design_items;
CREATE POLICY "design_items_select" ON design_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "roster_entries_select" ON roster_entries;
CREATE POLICY "roster_entries_select" ON roster_entries FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "budget_entries_select" ON budget_entries;
CREATE POLICY "budget_entries_select" ON budget_entries FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "venue_details_select" ON venue_details;
CREATE POLICY "venue_details_select" ON venue_details FOR SELECT TO anon, authenticated USING (true);
