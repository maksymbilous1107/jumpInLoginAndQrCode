-- =============================================
-- JumpIn QR Check-In: Supabase Database Schema
-- =============================================

-- 1. Create the profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  school text not null,
  dob date not null,
  last_checkin timestamptz,
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. Policy: Users can read their own profile
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- 4. Policy: Users can insert their own profile (registration)
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 5. Policy: Users can update their own profile (check-in timestamp)
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);
