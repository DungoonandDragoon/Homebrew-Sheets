-- ─────────────────────────────────────────────────────────────────────────────
-- RUN THIS ENTIRE FILE IN:
-- Supabase dashboard → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Characters table: stores full character state as JSON
create table if not exists characters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'Unnamed Character',
  class_id    text not null default 'outlaw',
  level       int  not null default 1,
  data        jsonb not null default '{}',   -- full character object
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Homebrew table: feats, species, backgrounds, items defined by DM
create table if not exists homebrew (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,   -- 'feat' | 'species' | 'background' | 'item'
  name        text not null,
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- DM users table: tracks who has DM access
create table if not exists dm_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  granted_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Players can only read/write their own characters.
-- DMs can read all characters.
-- Only DMs can write homebrew.
-- ─────────────────────────────────────────────────────────────────────────────

alter table characters enable row level security;
alter table homebrew    enable row level security;
alter table dm_users    enable row level security;

-- Helper function: is the current user a DM? SECURITY DEFINER so it reads
-- dm_users directly (bypassing dm_users' own RLS) instead of nesting a
-- second RLS-protected subquery inside every homebrew/characters policy —
-- this avoids any ambiguity about how Postgres evaluates nested RLS checks
-- and makes the DM check a single, easy-to-audit place.
create or replace function public.is_dm()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from dm_users where user_id = auth.uid());
$$;

-- Characters: players can CRUD their own
drop policy if exists "Players manage own characters" on characters;
create policy "Players manage own characters"
  on characters for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Characters: DMs can read all
drop policy if exists "DMs read all characters" on characters;
create policy "DMs read all characters"
  on characters for select
  using (public.is_dm());

-- Characters: DMs can also update any character — the DM View lets a DM open
-- and edit a player's sheet directly (HP overrides, granting feats, etc.),
-- and without this policy those edits are silently rejected by RLS because
-- the DM isn't the row's user_id.
drop policy if exists "DMs update any character" on characters;
create policy "DMs update any character"
  on characters for update
  using (public.is_dm())
  with check (public.is_dm());

-- Homebrew: anyone logged in can read
drop policy if exists "Anyone reads homebrew" on homebrew;
create policy "Anyone reads homebrew"
  on homebrew for select
  using (auth.uid() is not null);

-- Homebrew: only DMs can write — split into explicit per-command policies
-- (rather than one 'for all' policy) so each operation's permission is
-- unambiguous and easy to verify in the Supabase dashboard.
drop policy if exists "DMs write homebrew" on homebrew;
drop policy if exists "DMs insert homebrew" on homebrew;
drop policy if exists "DMs update homebrew" on homebrew;
drop policy if exists "DMs delete homebrew" on homebrew;
create policy "DMs insert homebrew"
  on homebrew for insert
  with check (public.is_dm());
create policy "DMs update homebrew"
  on homebrew for update
  using (public.is_dm())
  with check (public.is_dm());
create policy "DMs delete homebrew"
  on homebrew for delete
  using (public.is_dm());

-- DM users: only DMs can read (to check their own status)
drop policy if exists "DMs read dm_users" on dm_users;
create policy "DMs read dm_users"
  on dm_users for select
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists characters_user_id_idx on characters(user_id);
create index if not exists homebrew_type_idx on homebrew(type);

-- ─────────────────────────────────────────────────────────────────────────────
-- AFTER RUNNING THIS:
-- Go to Supabase → Authentication → Providers → Google → Enable
-- Then come back here and run the next line, replacing the email with yours,
-- AFTER you have signed in at least once with your Google account:
--
-- insert into dm_users (user_id)
-- select id from auth.users where email = 'YOUR_EMAIL@gmail.com';
--
-- ─────────────────────────────────────────────────────────────────────────────
