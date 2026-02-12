-- Add payroll columns to doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS per_day_salary numeric DEFAULT 0;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Add payroll columns to profiles table (for staff)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS per_day_salary numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Add payroll columns to staff table (if distinct from profiles)
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS per_day_salary numeric DEFAULT 0;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
-- staff already has salary
