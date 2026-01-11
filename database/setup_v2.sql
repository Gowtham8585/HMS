-- Hospital Settings
create table if not exists public.hospital_settings (
  id int primary key default 1,
  hospital_name text,
  address text,
  contact_number text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Staff (Those without logins like watchman, cleaner)
create table if not exists public.workers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null, -- 'watchman', 'cleaner', etc.
  per_day_salary numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Attendance Table (Unified)
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid, -- Can be profile_id or worker_id
  user_type text check (user_type in ('doctor', 'coworker', 'worker')),
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  status text default 'present',
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Medicine Stock (Added price if not there)
alter table public.medicines add column if not exists unit_price numeric default 0;

-- Bills Table
create table if not exists public.bills (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id),
  total_amount numeric default 0,
  status text default 'unpaid', -- 'paid', 'unpaid'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Bill Items
create table if not exists public.bill_items (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references public.bills(id),
  item_name text,
  quantity int,
  unit_price numeric,
  subtotal numeric,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for new tables
alter table public.hospital_settings enable row level security;
alter table public.workers enable row level security;
alter table public.attendance enable row level security;
alter table public.bills enable row level security;
alter table public.bill_items enable row level security;

create policy "Settings public" on public.hospital_settings for all using (true);
create policy "Workers public" on public.workers for all using (true);
create policy "Attendance public" on public.attendance for all using (true);
create policy "Bills public" on public.bills for all using (true);
create policy "Bill items public" on public.bill_items for all using (true);

-- Realtime
do $$ 
begin 
  alter publication supabase_realtime add table attendance; 
  alter publication supabase_realtime add table bills;
  alter publication supabase_realtime add table workers;
exception when others then null; 
end $$;
