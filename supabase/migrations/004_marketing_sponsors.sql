-- Marketing items and Sponsors tables.
-- Run this in the Supabase SQL Editor after previous migrations.

-- Marketing: tracks campaigns, deadlines, and platforms.
CREATE TYPE marketing_platform AS ENUM ('social_media', 'print', 'banner', 'video', 'website', 'other');
CREATE TYPE marketing_status AS ENUM ('not_started', 'in_progress', 'done');

CREATE TABLE marketing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  platform marketing_platform,
  deadline date,
  status marketing_status NOT NULL DEFAULT 'not_started',
  assigned_to uuid REFERENCES profiles (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX marketing_items_deadline_idx ON marketing_items (deadline);
CREATE INDEX marketing_items_assigned_to_idx ON marketing_items (assigned_to);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON marketing_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE marketing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_items_select" ON marketing_items
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "marketing_items_write" ON marketing_items
  FOR ALL TO authenticated USING (is_admin_or_lead()) WITH CHECK (is_admin_or_lead());

-- Sponsors: tracks sponsor relationships, contributions, and follow-ups.
CREATE TYPE sponsor_status AS ENUM ('lead', 'pending', 'confirmed', 'received');

CREATE TABLE sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text,
  contact_email text,
  contact_phone text,
  amount numeric(10, 2),
  status sponsor_status NOT NULL DEFAULT 'lead',
  follow_up_date date,
  notes text,
  created_by uuid REFERENCES profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sponsors_status_idx ON sponsors (status);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON sponsors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsors_select" ON sponsors
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sponsors_write" ON sponsors
  FOR ALL TO authenticated USING (is_admin_or_lead()) WITH CHECK (is_admin_or_lead());
