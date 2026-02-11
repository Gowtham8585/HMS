-- Fix RLS policies for appointments table to allow doctors to see their appointments

-- Drop existing policies
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow doctors to view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;

-- Create new policy for doctors to view their appointments
CREATE POLICY "Doctors can view their appointments"
ON public.appointments
FOR SELECT
USING (
    doctor_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- Create policy for admins to view all appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create policy for patients to view their own appointments
CREATE POLICY "Patients can view their appointments"
ON public.appointments
FOR SELECT
USING (
    patient_id IN (
        SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
);

-- Create policy for receptionists to view all appointments
CREATE POLICY "Receptionists can view all appointments"
ON public.appointments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'receptionist'
    )
);

-- Verify RLS is enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'appointments';
