# Fix Hospital Settings Connection

It seems the `hospital_settings` table might be missing the initial data or has incorrect permissions, preventing the page from loading or saving details.

Please run the following SQL script in your Supabase SQL Editor to fix the table structure and permissions.

1.  **Open Supabase Dashboard** and go to the **SQL Editor**.
2.  **Paste and Run** the following SQL:

```sql
-- Fix Hospital Settings Table
-- Ensure the table exists and has the correct permissions

create table if not exists public.hospital_settings (
  id int primary key default 1,
  hospital_name text,
  address text,
  contact_number text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure RLS is enabled
alter table public.hospital_settings enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Settings public" on public.hospital_settings;
drop policy if exists "Allow Full Access" on public.hospital_settings;

-- Create a permissive policy for everyone
create policy "Allow Full Access" on public.hospital_settings for all using (true) with check (true);

-- Ensure there is at least one row (ID 1)
insert into public.hospital_settings (id, hospital_name, address, contact_number)
values (1, 'City General Hospital', '123 Main St, Metro City', '+91 98765 43210')
on conflict (id) do nothing;

-- Grant permissions to anon and authenticated roles
grant all on public.hospital_settings to anon;
grant all on public.hospital_settings to authenticated;
grant all on public.hospital_settings to service_role;
```

3.  **Refresh** the Hospital Setup page in your browser.
