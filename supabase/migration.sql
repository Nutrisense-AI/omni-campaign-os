-- =====================================================================
-- OmniCampaign OS — Supabase Schema Migration
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New query → Run
-- Idempotent-ish: safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. USERS  (extends auth.users; PK == auth.users.id)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text,
  stripe_customer_id text,
  credit_balance    integer not null default 2,
  subscription_tier text    not null default 'free',
  meta_access_token text,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. CAMPAIGNS
-- ---------------------------------------------------------------------
create table if not exists public.campaigns (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  prompt            text,
  status            text not null default 'pending',        -- pending | processing | complete | failed
  status_step       text,                                    -- human readable current step
  output_data       jsonb,                                   -- full Claude JSON (captions, script, etc.)
  image_url         text,
  video_url         text,
  landing_page_html text,
  published_status  text default 'draft',
  error_message     text,
  created_at        timestamptz not null default now()
);
create index if not exists campaigns_user_idx on public.campaigns(user_id);

-- ---------------------------------------------------------------------
-- 3. MESSAGES  (Unified Inbox — website chat widget feeds this)
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  platform       text,                          -- 'website' | 'instagram' | 'facebook'
  sender_name    text,
  message_text   text,
  ai_draft_reply text,
  status         text not null default 'pending', -- pending | replied
  created_at     timestamptz not null default now()
);
create index if not exists messages_user_idx on public.messages(user_id);

-- ---------------------------------------------------------------------
-- 4. LEADS  (CRM Kanban)
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  status     text not null default 'new',   -- new | contacted | won | lost
  value      numeric default 0,
  created_at timestamptz not null default now()
);
create index if not exists leads_user_idx on public.leads(user_id);

-- ---------------------------------------------------------------------
-- 5. SUBSCRIBERS  (Email marketing list)
-- ---------------------------------------------------------------------
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);
create index if not exists subscribers_user_idx on public.subscribers(user_id);

-- ---------------------------------------------------------------------
-- 6. SCHEDULED_POSTS
-- ---------------------------------------------------------------------
create table if not exists public.scheduled_posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  campaign_id    uuid references public.campaigns(id) on delete cascade,
  platform       text,
  scheduled_time timestamptz,
  status         text not null default 'scheduled', -- scheduled | posted | failed
  created_at     timestamptz not null default now()
);
create index if not exists scheduled_posts_user_idx on public.scheduled_posts(user_id);

-- =====================================================================
-- TRIGGER: auto-create a public.users row when a new auth user signs up
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, credit_balance, subscription_tier)
  values (new.id, new.email, 2, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================================
-- ROW LEVEL SECURITY — users can only touch their own rows
-- =====================================================================
alter table public.users           enable row level security;
alter table public.campaigns       enable row level security;
alter table public.messages        enable row level security;
alter table public.leads           enable row level security;
alter table public.subscribers     enable row level security;
alter table public.scheduled_posts enable row level security;

-- USERS: a user can select/update only their own row
drop policy if exists "users_self_select" on public.users;
create policy "users_self_select" on public.users
  for select using (auth.uid() = id);
drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users
  for update using (auth.uid() = id);

-- Generic owner policies for the child tables
do $$
declare t text;
begin
  foreach t in array array['campaigns','messages','leads','subscribers','scheduled_posts']
  loop
    execute format('drop policy if exists "%1$s_owner_all" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_owner_all" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- =====================================================================
-- NOTE: The server-side service_role key BYPASSES RLS automatically,
-- so API routes (webhooks, generation pipeline, widget ingestion)
-- using the service key can write on behalf of users safely.
-- =====================================================================
