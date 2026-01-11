-- Add in_time and out_time to attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS in_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS out_time TIMESTAMP WITH TIME ZONE;

-- Migration: Copy check_in_time to in_time if check_in_time exists and in_time is null
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='check_in_time') THEN
        UPDATE public.attendance SET in_time = check_in_time WHERE in_time IS NULL;
    END IF;
END $$;
