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

-- Characters: players can CRUD their own
create policy "Players manage own characters"
  on characters for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Characters: DMs can read all
create policy "DMs read all characters"
  on characters for select
  using (
    exists (select 1 from dm_users where user_id = auth.uid())
  );

-- Homebrew: anyone logged in can read
create policy "Anyone reads homebrew"
  on homebrew for select
  using (auth.uid() is not null);

-- Homebrew: only DMs can write
create policy "DMs write homebrew"
  on homebrew for all
  using  (exists (select 1 from dm_users where user_id = auth.uid()))
  with check (exists (select 1 from dm_users where user_id = auth.uid()));

-- DM users: only DMs can read (to check their own status)
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
