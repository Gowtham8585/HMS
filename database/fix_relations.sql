-- fix_relations.sql

-- 1. Connect Workers to Auth Users
-- This ensures that if a User is deleted from Auth, their Worker profile is also removed.
-- NOTE: This requires that all current workers exist in auth.users. 
-- If you have "dummy" workers without logins, this might fail unless you remove the 'auth.users' reference requirement or create users for them.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workers_id_fkey'
    ) THEN
        ALTER TABLE public.workers
        ADD CONSTRAINT workers_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Ensure Hospital Settings Exists (Connects to App)
-- We insert the default row so the app always has something to load.
INSERT INTO public.hospital_settings (id, hospital_name, address, contact_number)
VALUES (1, 'My Clinic', '123 Main St', '555-0123')
ON CONFLICT (id) DO NOTHING;

-- 3. Connect Bills to Patients explicitly if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bills_patient_id_fkey'
    ) THEN
        ALTER TABLE public.bills
        ADD CONSTRAINT bills_patient_id_fkey
        FOREIGN KEY (patient_id) REFERENCES public.patients(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Connect Bill Items to Bills explicitly if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bill_items_bill_id_fkey'
    ) THEN
        ALTER TABLE public.bill_items
        ADD CONSTRAINT bill_items_bill_id_fkey
        FOREIGN KEY (bill_id) REFERENCES public.bills(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Add Comment explaining Attendance Polymorphism
COMMENT ON COLUMN public.attendance.user_id IS 'Links to either public.workers(id) OR public.profiles(id). Polymorphic relation.';

