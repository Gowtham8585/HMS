-- Enable Realtime for attendance table
alter publication supabase_realtime add table attendance;

-- Re-verify RLS policies for attendance
alter table public.attendance enable row level security;

drop policy if exists "Admins can view all attendance" on public.attendance;
create policy "Admins can view all attendance" on public.attendance
for select using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and (profiles.role = 'admin')
  )
);

-- Ensure profiles are readable by the join
drop policy if exists "Public profiles" on public.profiles;
create policy "Public profiles" on public.profiles for select using (true);
