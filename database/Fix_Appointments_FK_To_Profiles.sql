-- Fix appointments.doctor_id foreign key to point to profiles instead of doctors table
-- This resolves the "appointments_doctor_id_fkey" constraint violation error

-- Step 1: Clean up any orphaned appointments (appointments pointing to non-existent profiles)
DELETE FROM public.appointments 
WHERE doctor_id IS NOT NULL 
AND doctor_id NOT IN (SELECT id FROM public.profiles);

-- Step 2: Drop the old foreign key constraint
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

-- Step 3: Add new foreign key constraint pointing to profiles table
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_doctor_id_fkey 
FOREIGN KEY (doctor_id) 
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Verify the constraint was created
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'appointments'
AND kcu.column_name = 'doctor_id';
