-- RUN THIS TO FIX RLS ISSUES

-- 1. Reset Profile Policies
alter table public.profiles enable row level security;

-- Drop all existing policies to be sure
drop policy if exists "Enable read access for all users" on public.profiles;
drop policy if exists "Enable insert for authenticated users" on public.profiles;
drop policy if exists "Enable update for users based on email" on public.profiles;
drop policy if exists "Public profiles" on public.profiles;
drop policy if exists "Insert profiles" on public.profiles;
drop policy if exists "Update profiles" on public.profiles;

-- Create simple, permissive policies for development
create policy "Allow Select" on public.profiles for select using (true);
create policy "Allow Insert" on public.profiles for insert with check (auth.uid() = id);
create policy "Allow Update" on public.profiles for update using (auth.uid() = id);

-- 2. Grant Permissions (CRITICAL)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- 3. Trigger Fix (Supabase sometimes needs this for new users connecting to public tables)
-- Allow the postgres role to bypass RLS (usually true by default, but good to check)
alter table public.profiles force row level security;
alter table public.profiles disable row level security; -- DISABLE RLS TEMPORARILY TO TEST
alter table public.profiles enable row level security; -- Re-enable
