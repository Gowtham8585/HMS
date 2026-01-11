-- Fix Appointments Table Access
-- Ensure the table has RLS enabled but allows access

alter table public.appointments enable row level security;

-- Drop restrictive policies
drop policy if exists "Appointments public" on public.appointments;
drop policy if exists "Enable read access for all users" on public.appointments;

-- Create permissive policies for now (Refine later)
create policy "Allow Full Access" on public.appointments for all using (true) with check (true);

-- Grant permissions
grant all on public.appointments to anon;
grant all on public.appointments to authenticated;
grant all on public.appointments to service_role;

-- Also fix medicines usage just in case
alter table public.medicine_usage enable row level security;
create policy "Allow Full Access Usage" on public.medicine_usage for all using (true) with check (true);
grant all on public.medicine_usage to anon;
grant all on public.medicine_usage to authenticated;
grant all on public.medicine_usage to service_role;
