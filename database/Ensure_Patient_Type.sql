-- Add patient_type column if it doesn't exist
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_type text DEFAULT 'permanent';

-- Add check constraint if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'check_patient_type' 
  ) THEN 
    ALTER TABLE public.patients ADD CONSTRAINT check_patient_type CHECK (patient_type IN ('permanent', 'temporary'));
  END IF; 
END $$;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients';
