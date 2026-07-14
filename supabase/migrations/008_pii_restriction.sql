-- Column-level PII restriction for profiles and sponsors.
--
-- Postgres RLS is row-level, not column-level — a policy can't say "allow
-- this row but hide these two columns." So the pattern here is: tighten the
-- base table's SELECT policy to whoever should see EVERY column, then add a
-- "public" view that re-selects the same columns but nulls out the
-- sensitive ones for callers who shouldn't see them. The view is created by
-- this migration's role (which has BYPASSRLS on Supabase), so it can still
-- read the full underlying row even though the base table's RLS is now
-- tighter — the redaction happens in the view's own SELECT list, not RLS.
--
-- Run this in the Supabase SQL Editor after the previous migrations.

-- ----------------------------------------------------------------------------
-- profiles: email/phone visible to any authenticated user (any account),
-- hidden from anonymous/logged-out visitors. Matches the site's intent that
-- contact info is fine to share within the team, just not publicly.
-- ----------------------------------------------------------------------------

drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles
  for select to authenticated using (true);

create view profiles_public as
  select
    id,
    full_name,
    role,
    department_id,
    case when auth.uid() is not null then email else null end as email,
    case when auth.uid() is not null then phone else null end as phone,
    created_at,
    updated_at
  from profiles;

grant select on profiles_public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- sponsors: contact_name/contact_phone/notes visible to admin/team_lead only
-- (matches the existing UI boundary). amount and person_responsible are left
-- untouched — amount feeds the page's public "Confirmed: $X" total shown to
-- every visitor, and person_responsible was never gated in the UI to begin
-- with, so redacting either here would break existing behavior rather than
-- fix a leak.
-- ----------------------------------------------------------------------------

drop policy if exists "sponsors_select" on sponsors;
create policy "sponsors_select" on sponsors
  for select to authenticated using (is_admin_or_lead());

create view sponsors_public as
  select
    id,
    company_name,
    category,
    status,
    amount,
    person_responsible,
    case when is_admin_or_lead() then contact_name else null end as contact_name,
    case when is_admin_or_lead() then contact_phone else null end as contact_phone,
    case when is_admin_or_lead() then notes else null end as notes,
    created_by,
    created_at,
    updated_at
  from sponsors;

grant select on sponsors_public to anon, authenticated;
