-- IMPORTANT: Run this ENTIRE file in your Supabase SQL Editor (Dashboard -> SQL Editor)

-- Enable UUID extension first (if not already enabled)
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table (Linked to Auth)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text check (role in ('admin', 'doctor', 'coworker', 'patient')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Doctors Table
create table if not exists public.doctors (
  id uuid default gen_random_uuid() primary key,
  name text,
  specialization text,
  availability text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Patients Table
create table if not exists public.patients (
  id uuid default gen_random_uuid() primary key,
  name text,
  age int,
  gender text,
  phone text,
  medical_history text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Appointments Table
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id),
  doctor_id uuid references public.doctors(id) null,
  appointment_date date,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create Medicines Table
create table if not exists public.medicines (
  id uuid default gen_random_uuid() primary key,
  medicine_name text,
  stock_quantity int default 0,
  expiry_date date,
  price numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Medicine Usage Table
create table if not exists public.medicine_usage (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id),
  medicine_id uuid references public.medicines(id),
  quantity_used int,
  date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Policies (RLS)
-- We drop and recreate policies to ensure they are correct (idempotent approach)

alter table public.profiles enable row level security;
drop policy if exists "Public profiles" on public.profiles;
create policy "Public profiles" on public.profiles for select using (true);
drop policy if exists "Insert profiles" on public.profiles;
create policy "Insert profiles" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Update profiles" on public.profiles;
create policy "Update profiles" on public.profiles for update using (auth.uid() = id);

alter table public.doctors enable row level security;
drop policy if exists "Doctors public" on public.doctors;
create policy "Doctors public" on public.doctors for all using (true);

alter table public.patients enable row level security;
drop policy if exists "Patients public" on public.patients;
create policy "Patients public" on public.patients for all using (true);

alter table public.appointments enable row level security;
drop policy if exists "Appointments public" on public.appointments;
create policy "Appointments public" on public.appointments for all using (true);

alter table public.medicines enable row level security;
drop policy if exists "Medicines public" on public.medicines;
create policy "Medicines public" on public.medicines for all using (true);

alter table public.medicine_usage enable row level security;
drop policy if exists "Usage public" on public.medicine_usage;
create policy "Usage public" on public.medicine_usage for all using (true);

-- Enable Realtime (Ignore errors if already enabled)
do $$ 
begin 
  alter publication supabase_realtime add table appointments; 
exception when others then null; 
end $$;

do $$ 
begin 
  alter publication supabase_realtime add table medicines; 
exception when others then null; 
end $$;
