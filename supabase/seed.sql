-- ============================================================================
-- SevaBoard seed data
--
-- Run this after schema.sql. Safe to re-run (uses ON CONFLICT DO NOTHING).
-- ============================================================================

-- Starter departments
insert into departments (name, description) values
  ('Budget', 'Tracks income, expenses, and overall event budget'),
  ('Design', 'Posters, social media graphics, and decor design'),
  ('Program', 'Stage program, performances, and activity scheduling'),
  ('Seva', 'Volunteer service roles and shift coverage'),
  ('Hospitality', 'Food, prasad, and guest comfort'),
  ('Marketing', 'Promotion, outreach, and announcements'),
  ('Logistics', 'Venue setup, equipment, and on-the-day operations')
on conflict (name) do nothing;

-- Program planner rooms
insert into rooms (name, sort_order) values
  ('High Energy', 0),
  ('Bhakti', 1),
  ('Corridor', 2)
on conflict (name) do nothing;
