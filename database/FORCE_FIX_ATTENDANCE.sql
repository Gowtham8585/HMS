-- 1. Reset Attendance Policies
alter table public.attendance enable row level security;
drop policy if exists "Admins can view all attendance" on public.attendance;
drop policy if exists "Users can view their own attendance" on public.attendance;
drop policy if exists "Users can insert their own attendance" on public.attendance;

-- Simple permissive policy for attendance
create policy "Attendance access" on public.attendance for all using (true);

-- 2. Reset Profile Policies
alter table public.profiles enable row level security;
drop policy if exists "Allow Select" on public.profiles;
drop policy if exists "Public profiles" on public.profiles;

-- Simple permissive policy for profiles
create policy "Profile access" on public.profiles for select using (true);

-- 3. Grant Permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- 4. Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table attendance, profiles;
