-- ============================================================================
-- SevaBoard database schema
--
-- Run this whole file once in the Supabase SQL editor (Database > SQL Editor)
-- on a fresh project, then run seed.sql. See ../SUPABASE_SETUP.md for the
-- full walkthrough.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------

create type user_role as enum ('admin', 'team_lead', 'member', 'volunteer');
create type task_status as enum ('not_started', 'in_progress', 'done');
create type design_status as enum ('not_started', 'in_progress', 'done', 'approved');
create type design_platform as enum ('irl', 'digital');
create type budget_type as enum ('income', 'expense');

-- ----------------------------------------------------------------------------
-- Core tables: departments <-> profiles (circular FK, resolved via ALTER)
-- ----------------------------------------------------------------------------

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  lead_id uuid,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role user_role not null default 'member',
  department_id uuid references departments (id) on delete set null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table departments
  add constraint departments_lead_id_fkey
  foreign key (lead_id) references profiles (id) on delete set null;

create index profiles_department_id_idx on profiles (department_id);

-- ----------------------------------------------------------------------------
-- RLS helper functions (security definer to avoid recursive RLS on profiles)
-- ----------------------------------------------------------------------------

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_admin_or_lead()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'team_lead')
  );
$$;

-- ----------------------------------------------------------------------------
-- auth.users -> profiles sync triggers
-- ----------------------------------------------------------------------------

-- Auto-create a profile (default role: member) whenever an admin creates a
-- new auth user. New users start with no department until an admin assigns one.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Keep profiles.email in sync if a user's auth email changes.
create or replace function sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function sync_user_email();

-- Prevent non-admins from changing their own role/department via a
-- direct UPDATE to profiles (defense in depth alongside RLS policies).
create or replace function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not is_admin() then
    new.role = old.role;
    new.department_id = old.department_id;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_escalation
  before update on profiles
  for each row execute function prevent_self_role_escalation();

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Program Planner: rooms, program items, brainstorming notes
-- ----------------------------------------------------------------------------

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0
);

create table program_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms (id) on delete cascade,
  start_time time not null,
  end_time time not null,
  activity_name text not null,
  description text,
  assigned_to uuid references profiles (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index program_items_room_id_idx on program_items (room_id);
create index program_items_assigned_to_idx on program_items (assigned_to);

create table room_notes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references rooms (id) on delete cascade,
  content text,
  updated_by uuid references profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on program_items
  for each row execute function set_updated_at();
create trigger set_updated_at before update on room_notes
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Planning Timeline: week 16 -> 0 scrum-style task tracker
-- ----------------------------------------------------------------------------

create table planning_tasks (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null,
  week_number integer not null check (week_number between 0 and 16),
  assigned_to uuid references profiles (id) on delete set null,
  status task_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index planning_tasks_assigned_to_idx on planning_tasks (assigned_to);
create index planning_tasks_week_number_idx on planning_tasks (week_number);

create trigger set_updated_at before update on planning_tasks
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Design List
-- ----------------------------------------------------------------------------

create table design_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  status design_status not null default 'not_started',
  platform design_platform,
  post_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on design_items
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Seva Roster
-- ----------------------------------------------------------------------------

create table roster_entries (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references profiles (id) on delete set null,
  person_name text,
  seva_role text not null,
  time_slot text,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roster_entries_person_id_idx on roster_entries (person_id);

create trigger set_updated_at before update on roster_entries
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Budget & Spending
-- ----------------------------------------------------------------------------

create table budget_entries (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  category text not null,
  amount numeric(10, 2) not null,
  entry_date date not null,
  notes text,
  type budget_type not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index budget_entries_type_idx on budget_entries (type);

create trigger set_updated_at before update on budget_entries
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Venue Details (single-row settings table)
-- ----------------------------------------------------------------------------

create table venue_details (
  id integer primary key default 1,
  venue_name text,
  address text,
  event_date date,
  event_time time,
  map_link text,
  parking_notes text,
  other_notes text,
  updated_by uuid references profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint venue_details_singleton check (id = 1)
);

create trigger set_updated_at before update on venue_details
  for each row execute function set_updated_at();

insert into venue_details (id) values (1);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table departments enable row level security;
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table program_items enable row level security;
alter table room_notes enable row level security;
alter table planning_tasks enable row level security;
alter table design_items enable row level security;
alter table roster_entries enable row level security;
alter table budget_entries enable row level security;
alter table venue_details enable row level security;

-- profiles: everyone can read; users update their own row (role/department
-- changes are blocked by the trigger above unless admin); admins manage all.
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_insert_admin" on profiles for insert to authenticated with check (is_admin());
create policy "profiles_update_own_or_admin" on profiles for update to authenticated
  using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());
create policy "profiles_delete_admin" on profiles for delete to authenticated using (is_admin());

-- departments: everyone can read; admins/team leads manage.
create policy "departments_select" on departments for select to authenticated using (true);
create policy "departments_write" on departments for all to authenticated
  using (is_admin_or_lead()) with check (is_admin_or_lead());

-- rooms: everyone can read; admins/team leads manage.
create policy "rooms_select" on rooms for select to authenticated using (true);
create policy "rooms_write" on rooms for all to authenticated
  using (is_admin_or_lead()) with check (is_admin_or_lead());

-- room_notes: everyone can read; admins/team leads manage.
create policy "room_notes_select" on room_notes for select to authenticated using (true);
create policy "room_notes_write" on room_notes for all to authenticated
  using (is_admin_or_lead()) with check (is_admin_or_lead());

-- program_items: everyone can read; admins/team leads manage.
create policy "program_items_select" on program_items for select to authenticated using (true);
create policy "program_items_write" on program_items for all to authenticated
  using (is_admin_or_lead()) with check (is_admin_or_lead());

-- planning_tasks: everyone can read; admins/team leads manage everything;
-- members can update (e.g. status) on tasks assigned to them.
create policy "planning_tasks_select" on planning_tasks for select to authenticated using (true);
create policy "planning_tasks_insert" on planning_tasks for insert to authenticated
  with check (is_admin_or_lead());
create policy "planning_tasks_update" on planning_tasks for update to authenticated
  using (is_admin_or_lead() or assigned_to = auth.uid())
  with check (is_admin_or_lead() or assigned_to = auth.uid());
create policy "planning_tasks_delete" on planning_tasks for delete to authenticated
  using (is_admin_or_lead());

-- design_items: everyone can read; admins/team leads manage.
create policy "design_items_select" on design_items for select to authenticated using (true);
create policy "design_items_write" on design_items for all to authenticated
  using (is_admin_or_lead()) with check (is_admin_or_lead());

-- roster_entries: everyone can read; admins/team leads manage.
create policy "roster_entries_select" on roster_entries for select to authenticated using (true);
create policy "roster_entries_write" on roster_entries for all to authenticated
  using (is_admin_or_lead()) with check (is_admin_or_lead());

-- budget_entries: everyone can read (transparency); admins/team leads manage.
create policy "budget_entries_select" on budget_entries for select to authenticated using (true);
create policy "budget_entries_write" on budget_entries for all to authenticated
  using (is_admin_or_lead()) with check (is_admin_or_lead());

-- venue_details: everyone can read; admins/team leads edit.
create policy "venue_details_select" on venue_details for select to authenticated using (true);
create policy "venue_details_write" on venue_details for all to authenticated
  using (is_admin_or_lead()) with check (is_admin_or_lead());

-- ============================================================================
-- Realtime: live updates for tasks, program items, roster, and budget
-- ============================================================================

alter publication supabase_realtime add table program_items;
alter publication supabase_realtime add table planning_tasks;
alter publication supabase_realtime add table roster_entries;
alter publication supabase_realtime add table budget_entries;
