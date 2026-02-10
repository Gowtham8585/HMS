
-- FIX READ POLICIES FOR LISTS
-- Ensure Admins (and authenticated users if needed) can READ all lists

-- 1. DOCTORS
DROP POLICY IF EXISTS "Anyone Can Read Doctors" ON public.doctors;
CREATE POLICY "Anyone Can Read Doctors" ON public.doctors FOR SELECT TO authenticated USING (true);

-- 2. STAFF
DROP POLICY IF EXISTS "Anyone Can Read Staff" ON public.staff;
CREATE POLICY "Anyone Can Read Staff" ON public.staff FOR SELECT TO authenticated USING (true);

-- 3. WORKERS
DROP POLICY IF EXISTS "Anyone Can Read Workers" ON public.workers;
CREATE POLICY "Anyone Can Read Workers" ON public.workers FOR SELECT TO authenticated USING (true);

-- 4. PATIENTS
DROP POLICY IF EXISTS "Admins Read Patients" ON public.patients;
CREATE POLICY "Admins Read Patients" ON public.patients FOR SELECT TO authenticated USING (
   EXISTS(SELECT 1 FROM public.admins WHERE id = auth.uid()) OR (auth.jwt() ->> 'email' LIKE '%admin%')
);
-- Doctors/Staff might need to read patients too
CREATE POLICY "Medical Staff Read Patients" ON public.patients FOR SELECT TO authenticated USING (
   EXISTS(SELECT 1 FROM public.doctors WHERE id = auth.uid()) OR EXISTS(SELECT 1 FROM public.staff WHERE id = auth.uid())
);
