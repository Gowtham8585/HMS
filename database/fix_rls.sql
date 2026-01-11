-- RUN THIS TO FIX RLS ISSUES

alter table public.profiles enable row level security;

drop policy if exists "Enable read access for all users" on public.profiles;
create policy "Enable read access for all users" on public.profiles for select using (true);

drop policy if exists "Enable insert for authenticated users" on public.profiles;
create policy "Enable insert for authenticated users" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Enable update for users based on email" on public.profiles;
create policy "Enable update for users based on email" on public.profiles for update using (auth.uid() = id);

-- CRITICAL: Grant usage on public schema to anon and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
