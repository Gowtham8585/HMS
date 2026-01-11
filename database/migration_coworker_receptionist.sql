-- Migration: Coworker -> Receptionist

-- 1. Update profiles role
UPDATE public.profiles
SET role = 'receptionist'
WHERE role = 'coworker';

-- 2. Update attendance user_type
-- First, we might need to drop the check constraint if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_user_type_check') THEN
      ALTER TABLE public.attendance DROP CONSTRAINT attendance_user_type_check;
  END IF;
END $$;

-- Update values
UPDATE public.attendance
SET user_type = 'receptionist'
WHERE user_type = 'coworker';

-- Re-add constraint with new value
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_user_type_check 
CHECK (user_type IN ('doctor', 'receptionist', 'worker'));

-- 3. Update any other tables?
-- 'doctors' table usually just has 'doctor'.
-- 'workers' table has 'Worker' role default, but that's different.
