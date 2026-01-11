-- Create Attendance Table
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date default current_date not null,
  status text check (status in ('present', 'absent', 'late')),
  check_in_time timestamp with time zone default now(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date) -- Prevents duplicate check-ins for the same day
);

-- Create Bills Table
create table if not exists public.bills (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id),
  patient_name text, -- Handy for quick view
  items jsonb, -- Stores array of items {name, price, qty}
  total_amount numeric not null,
  status text default 'unpaid' check (status in ('unpaid', 'paid')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.attendance enable row level security;
alter table public.bills enable row level security;

-- Attendance Policies
drop policy if exists "Users can view their own attendance" on public.attendance;
create policy "Users can view their own attendance" on public.attendance
for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own attendance" on public.attendance;
create policy "Users can insert their own attendance" on public.attendance
for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can view all attendance" on public.attendance;
create policy "Admins can view all attendance" on public.attendance
for select using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Bills Policies
drop policy if exists "Admins can do everything with bills" on public.bills;
create policy "Admins can do everything with bills" on public.bills
for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Allow co-workers to create bills (billing staff)
drop policy if exists "Coworkers can create bills" on public.bills;
create policy "Coworkers can create bills" on public.bills
for insert with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'coworker'
  )
);
