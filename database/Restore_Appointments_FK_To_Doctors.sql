-- Restore appointments.doctor_id foreign key to point to doctors table
-- This aligns the backend with the frontend logic where both BookAppointment.jsx and DoctorDashboard.jsx use doctors.id

-- Step 1: Clean up any orphaned appointments
DELETE FROM public.appointments 
WHERE doctor_id IS NOT NULL 
AND doctor_id NOT IN (SELECT id FROM public.doctors);

-- Step 2: Drop the old foreign key constraint (whether it points to profiles or somewhere else)
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

-- Step 3: Add new foreign key constraint pointing to doctors table
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_doctor_id_fkey 
FOREIGN KEY (doctor_id) 
REFERENCES public.doctors(id)
ON DELETE CASCADE;

-- Also verify prescriptions table points to doctors(id) if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prescriptions') THEN
        ALTER TABLE public.prescriptions 
        DROP CONSTRAINT IF EXISTS prescriptions_doctor_id_fkey;
        
        ALTER TABLE public.prescriptions 
        ADD CONSTRAINT prescriptions_doctor_id_fkey 
        FOREIGN KEY (doctor_id) 
        REFERENCES public.doctors(id)
        ON DELETE CASCADE;
    END IF;
END $$;
