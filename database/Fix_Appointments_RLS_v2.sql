-- Drop ALL existing RLS policies on appointments table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.appointments';
    END LOOP;
END $$;

-- Create new comprehensive RLS policies for appointments

-- 1. Doctors can view their appointments
CREATE POLICY "Doctors can view their appointments"
ON public.appointments
FOR SELECT
USING (
    doctor_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- 2. Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 3. Patients can view their own appointments
CREATE POLICY "Patients can view their appointments"
ON public.appointments
FOR SELECT
USING (
    patient_id IN (
        SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
);

-- 4. Receptionists can view all appointments
CREATE POLICY "Receptionists can view all appointments"
ON public.appointments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'receptionist'
    )
);

-- 5. Staff can view all appointments
CREATE POLICY "Staff can view all appointments"
ON public.appointments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'staff'
    )
);

-- INSERT policies
CREATE POLICY "Admins can insert appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist', 'doctor')
    )
);

-- UPDATE policies
CREATE POLICY "Admins can update appointments"
ON public.appointments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist', 'doctor')
    )
);

-- DELETE policies
CREATE POLICY "Admins can delete appointments"
ON public.appointments
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Ensure RLS is enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Verify policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
        ELSE cmd
    END as operation
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY cmd, policyname;
