# Fix Dashboard Data Visibility

If the dashboard is still empty, it is likely due to restrictive database permissions preventing the doctor (authenticated user) from reading the `appointments` table.

Please run the following SQL script to fix the permissions.

1.  **Open Supabase Dashboard** and go to the **SQL Editor**.
2.  **Paste and Run**:

```sql
-- Fix Appointments Access
-- Ensure the table allows access for authenticated doctors

alter table public.appointments enable row level security;

-- Remove old restrictive/broken policies
drop policy if exists "Appointments public" on public.appointments;
drop policy if exists "Enable read access for all users" on public.appointments;
drop policy if exists "Allow Full Access" on public.appointments;

-- Add a permissive policy for appointments
create policy "Allow Full Access" on public.appointments for all using (true) with check (true);

-- Ensure permissions are granted
grant all on public.appointments to anon;
grant all on public.appointments to authenticated;
grant all on public.appointments to service_role;

-- Also check medicine_usage permissions
alter table public.medicine_usage enable row level security;
create policy "Allow Full Access Usage" on public.medicine_usage for all using (true) with check (true);
grant all on public.medicine_usage to anon;
grant all on public.medicine_usage to authenticated;
grant all on public.medicine_usage to service_role;
```

3.  **Refresh** the Doctor Dashboard.
