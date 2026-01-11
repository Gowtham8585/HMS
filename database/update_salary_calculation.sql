-- Add per_day_salary to allow calculation based on attendance
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS per_day_salary NUMERIC DEFAULT 0;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS per_day_salary NUMERIC DEFAULT 0;

-- Optional: Add a work_hours column to attendance if we want to store calculated hours
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS work_hours NUMERIC DEFAULT 0;
