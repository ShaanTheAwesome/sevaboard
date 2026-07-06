-- Sponsor categories: named, colored labels for grouping sponsors.
-- Run this in the Supabase SQL Editor after previous migrations.

CREATE TABLE sponsor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT 'blue',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sponsor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_categories_select" ON sponsor_categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sponsor_categories_write" ON sponsor_categories
  FOR ALL TO authenticated USING (is_admin_or_lead()) WITH CHECK (is_admin_or_lead());
