-- Venue Details photo gallery (venue map/layout images, one per room/area).
-- Adds a table for photo metadata + a public Storage bucket for the files.
-- Run this in the Supabase SQL Editor after the previous migrations.

create table venue_photos (
  id uuid primary key default gen_random_uuid(),
  label text,
  image_path text not null,
  sort_order integer not null default 0,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index venue_photos_sort_order_idx on venue_photos (sort_order);

alter table venue_photos enable row level security;

create policy "venue_photos_select" on venue_photos
  for select to anon, authenticated using (true);
create policy "venue_photos_write" on venue_photos
  for all to authenticated using (is_admin_or_lead()) with check (is_admin_or_lead());

-- Storage bucket for the actual image files. Public read (matches the rest
-- of Venue Details), admin/lead-only write, same trust model as the table.
insert into storage.buckets (id, name, public)
values ('venue-photos', 'venue-photos', true)
on conflict (id) do nothing;

create policy "venue_photos_storage_select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'venue-photos');
create policy "venue_photos_storage_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'venue-photos' and is_admin_or_lead());
create policy "venue_photos_storage_update" on storage.objects
  for update to authenticated using (bucket_id = 'venue-photos' and is_admin_or_lead());
create policy "venue_photos_storage_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'venue-photos' and is_admin_or_lead());
