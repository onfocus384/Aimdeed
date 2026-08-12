-- ============================================================
-- Aimdeed — Supabase schema (run in the Supabase SQL Editor)
-- ============================================================

-- ------------------------------------------------------------
-- PROFILES  (1:1 with auth.users; holds username / display name)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null,
  email        text,
  display_name text,
  created_at   timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep profile email in sync with auth.users
create or replace function public.handle_updated_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute procedure public.handle_updated_user();

-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  amount         int  not null check (amount in (499, 799, 999)),
  status         text not null default 'PENDING'
                 check (status in ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED')),
  payer_name     text,
  upi_link       text,
  utr_id         text unique,
  transaction_id text,
  payment_method text,
  verified_at    timestamptz,
  expires_at     timestamptz not null default now() + interval '30 minutes',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists payments_user_id_status_idx on public.payments (user_id, status);
create index if not exists payments_expires_at_idx on public.payments (expires_at);

alter table public.payments enable row level security;

drop policy if exists "Payments are viewable by owner" on public.payments;
create policy "Payments are viewable by owner"
  on public.payments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own payment" on public.payments;
create policy "Users can insert their own payment"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- GOOGLE OAUTH (optional)
-- Enable in Dashboard → Authentication → Providers → Google,
-- and set the callback URL to:  <your-supabase-url>/auth/v1/callback
-- ------------------------------------------------------------
