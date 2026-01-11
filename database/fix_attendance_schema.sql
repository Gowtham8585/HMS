-- fix_attendance_schema.sql

-- 1. Add "check_in" column if it doesn't exist
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS check_in TIMESTAMP WITH TIME ZONE;

-- 2. Add "check_out" column if it doesn't exist
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS check_out TIMESTAMP WITH TIME ZONE;

-- 3. Add "in_time" column (legacy support)
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS in_time TIMESTAMP WITH TIME ZONE;

-- 4. Add "out_time" column (legacy support)
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS out_time TIMESTAMP WITH TIME ZONE;

-- 5. Copy data from legacy "in_time" to "check_in" if check_in is empty
UPDATE public.attendance 
SET check_in = in_time 
WHERE check_in IS NULL AND in_time IS NOT NULL;

-- 6. Copy data from "check_in_time" (another possible legacy name) to "check_in"
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='check_in_time') THEN
        UPDATE public.attendance SET check_in = check_in_time WHERE check_in IS NULL;
    END IF;
END $$;

-- 7. Copy data from legacy "out_time" to "check_out"
UPDATE public.attendance 
SET check_out = out_time 
WHERE check_out IS NULL AND out_time IS NOT NULL;

-- 8. Verify the columns now exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'attendance';
