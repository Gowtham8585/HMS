-- FIX PAYROLL TABLE COLUMNS
-- This script ensures all necessary columns exist on Doctors and Staff tables for payroll.

-- 1. DOCTORS TABLE
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS per_day_salary numeric DEFAULT 0;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- 2. STAFF TABLE (Receptionist, etc)
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS per_day_salary numeric DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- 3. PROFILES TABLE (Legacy fallback, good to have)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS per_day_salary numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- 4. ENSURE ATTENDANCE TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  status text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT attendance_pkey PRIMARY KEY (id)
);

-- 5. ENSURE RLS FOR ATTENDANCE
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Attendance" ON public.attendance;
CREATE POLICY "Public Attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- 6. ENSURE WORKERS HAVE SALARY COLUMNS TOO (Just in case)
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS per_day_salary numeric DEFAULT 0;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
