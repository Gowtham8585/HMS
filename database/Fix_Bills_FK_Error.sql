-- 1. Add Foreign Key Constraint to bills table
-- We use DO block to avoid error if constraint already exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'bills_patient_id_fkey' 
    AND table_name = 'bills'
  ) THEN 
    ALTER TABLE public.bills 
    ADD CONSTRAINT bills_patient_id_fkey 
    FOREIGN KEY (patient_id) 
    REFERENCES public.patients(id) 
    ON DELETE CASCADE; -- Or NULL ? admin might want to keep history. let's say CASCADE or SET NULL. If patient is deleted, bills might be relevant. Let's use SET NULL for safety or CASCADE if strict. Usually bills should stay. Let's start with NO ACTION or just standard FK. 
    -- Actually, if we delete a patient, we might want to keep the financial record. But often in these simple apps, cascade is easier. 
    -- Let's stick to standard FK.
  END IF; 
END $$;

-- 2. Force a schema cache reload (usually automatic, but good to trigger just in case)
NOTIFY pgrst, 'reload config';

-- 3. Verify the column type matches
ALTER TABLE public.bills 
ALTER COLUMN patient_id TYPE uuid USING patient_id::uuid;
