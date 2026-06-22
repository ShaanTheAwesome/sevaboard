-- Allow budget entries with no amount yet (TBA / to be announced).
-- Run this in the Supabase SQL Editor after the initial schema.sql.
ALTER TABLE budget_entries ALTER COLUMN amount DROP NOT NULL;
