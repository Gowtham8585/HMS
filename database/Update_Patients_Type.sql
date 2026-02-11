-- Make user_id optional (nullable) in patients table
ALTER TABLE public.patients ALTER COLUMN user_id DROP NOT NULL;

-- Add 'patient_type' column
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_type text DEFAULT 'permanent';

-- Set default for existing records
UPDATE public.patients SET patient_type = 'permanent' WHERE patient_type IS NULL;

-- Add check constraint for patient_type
ALTER TABLE public.patients ADD CONSTRAINT check_patient_type CHECK (patient_type IN ('permanent', 'temporary'));
