
-- Ensures Admins can insert/update/delete any record in role tables
-- Use a simple email check as recursion fallback (Or use Service Role if possible)

-- Doctors
DROP POLICY IF EXISTS "Admins Manage Doctors" ON public.doctors;
CREATE POLICY "Admins Manage Doctors" ON public.doctors FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'email') IN (SELECT email FROM public.admins) OR (auth.jwt() ->> 'email') = 'admin@gmail.com'
);

-- Staff
DROP POLICY IF EXISTS "Admins Manage Staff" ON public.staff;
CREATE POLICY "Admins Manage Staff" ON public.staff FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'email') IN (SELECT email FROM public.admins) OR (auth.jwt() ->> 'email') = 'admin@gmail.com'
);

-- Workers
DROP POLICY IF EXISTS "Admins Manage Workers" ON public.workers;
CREATE POLICY "Admins Manage Workers" ON public.workers FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'email') IN (SELECT email FROM public.admins) OR (auth.jwt() ->> 'email') = 'admin@gmail.com'
);

-- Patients
DROP POLICY IF EXISTS "Admins Manage Patients" ON public.patients;
CREATE POLICY "Admins Manage Patients" ON public.patients FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'email') IN (SELECT email FROM public.admins) OR (auth.jwt() ->> 'email') = 'admin@gmail.com'
);
