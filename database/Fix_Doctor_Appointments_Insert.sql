-- Allow doctors (and any authenticated user) to create quick prescription appointments
DROP POLICY IF EXISTS "Doctors can insert appointments" ON public.appointments;
CREATE POLICY "Doctors can insert appointments" ON public.appointments 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- Ensure updating is allowed too (just in case)
DROP POLICY IF EXISTS "Doctors can update appointments" ON public.appointments;
CREATE POLICY "Doctors can update appointments" ON public.appointments 
FOR UPDATE TO authenticated 
USING (true)
WITH CHECK (true);
