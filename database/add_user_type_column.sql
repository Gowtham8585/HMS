-- Fix Attendance Table Schema

-- 1. Add user_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'user_type') THEN
        ALTER TABLE public.attendance ADD COLUMN user_type TEXT;
    END IF;
END $$;

-- 2. Populate user_type based on existing users
-- Doctors
UPDATE public.attendance
SET user_type = 'doctor'
WHERE user_id IN (SELECT id FROM public.doctors)
AND user_type IS NULL;

-- Receptionists (formerly coworkers)
UPDATE public.attendance
SET user_type = 'receptionist'
WHERE user_id IN (SELECT id FROM public.profiles WHERE role IN ('receptionist', 'coworker'))
AND user_type IS NULL;

-- Workers
UPDATE public.attendance
SET user_type = 'worker'
WHERE user_id IN (SELECT id FROM public.workers)
AND user_type IS NULL;

-- Patients
UPDATE public.attendance
SET user_type = 'patient'
WHERE user_id IN (SELECT id FROM public.patients)
AND user_type IS NULL;

-- 3. Now adding the constraint safely
-- We won't add a strict constraint immediately to avoid locking out data, but we can if we are sure coverage is 100%
-- ALTER TABLE public.attendance ADD CONSTRAINT attendance_user_type_check CHECK (user_type IN ('doctor', 'receptionist', 'worker', 'patient'));
