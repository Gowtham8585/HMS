
-- URGENT RLS FIX: ALLOW ADMINS TO MANAGE ALL TABLES

-- 1. Helper Function to Check Admin Status safely
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user exists in admins table OR has admin metadata
  -- (Using exists in admins table is cleaner)
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant Full Access to Admins on Core Tables
-- DOCTORS
DROP POLICY IF EXISTS "Admins Manage Doctors" ON public.doctors;
CREATE POLICY "Admins Manage Doctors" ON public.doctors FOR ALL TO authenticated USING (public.is_admin_safe());

-- STAFF
DROP POLICY IF EXISTS "Admins Manage Staff" ON public.staff;
CREATE POLICY "Admins Manage Staff" ON public.staff FOR ALL TO authenticated USING (public.is_admin_safe());

-- WORKERS
DROP POLICY IF EXISTS "Admins Manage Workers" ON public.workers;
CREATE POLICY "Admins Manage Workers" ON public.workers FOR ALL TO authenticated USING (public.is_admin_safe());

-- PATIENTS
DROP POLICY IF EXISTS "Admins Manage Patients" ON public.patients;
CREATE POLICY "Admins Manage Patients" ON public.patients FOR ALL TO authenticated USING (public.is_admin_safe());

-- 3. Also fix self-read policies so users can see their own data
DROP POLICY IF EXISTS "Doctors Read Self" ON public.doctors;
CREATE POLICY "Doctors Read Self" ON public.doctors FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Staff Read Self" ON public.staff;
CREATE POLICY "Staff Read Self" ON public.staff FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Workers Read Self" ON public.workers;
CREATE POLICY "Workers Read Self" ON public.workers FOR SELECT TO authenticated USING (auth.uid() = id);

-- 4. Ensure RLS is enabled
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
