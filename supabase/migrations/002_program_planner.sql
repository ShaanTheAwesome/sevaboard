-- Program Planner: add room columns, color, and event column assignment.
-- Run this in the Supabase SQL Editor after schema.sql and 001_budget_tba.sql.

-- Rooms can now define named sub-columns (e.g. ["Event","Stage"]) and a color.
ALTER TABLE rooms ADD COLUMN columns jsonb NOT NULL DEFAULT '["Event"]';
ALTER TABLE rooms ADD COLUMN color text NOT NULL DEFAULT 'blue';

-- Each program item can belong to a specific sub-column within its room.
ALTER TABLE program_items ADD COLUMN column_name text;

-- Update existing seed rooms and add the fourth.
UPDATE rooms SET columns = '["Event", "Stage"]', color = 'blue' WHERE name = 'High Energy';
UPDATE rooms SET name = 'CM Room + Bhakti', columns = '["Half 1", "Half 2"]', color = 'purple' WHERE name = 'Bhakti';
UPDATE rooms SET name = 'Corridor Area', columns = '["Event"]', color = 'emerald' WHERE name = 'Corridor';

INSERT INTO rooms (name, columns, color, sort_order)
VALUES ('Foyer', '["Event"]', 'amber', 3)
ON CONFLICT (name) DO NOTHING;
