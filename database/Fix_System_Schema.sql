
-- =================================================================
-- MASTER FIX SCRIPT: SCHEMA, POLICIES, AND DATA SYNC
-- =================================================================
-- Run this ENTIRE script to fix missing tables and permissions.

-- AGGRESSIVE FIX: DISABLE RLS FOR TESTING (Optional, revert later)
ALTER TABLE public.doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY; -- Added Patients

-- ... or keep them enabled but make policies "USING (true) WITH CHECK (true)" for ANON too?
-- No, let's stick to authenticated.

-- 1. SETUP PROFILES TABLE (The Core Table)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Removed foreign key constraint for flexibility during repair
    email TEXT,
    role TEXT DEFAULT 'patient',
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for public access (testing only)
DROP POLICY IF EXISTS "Public Profiles Access" ON public.profiles;
CREATE POLICY "Public Profiles Access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. SETUP DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY, -- Removed strict foreign key
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  email TEXT,
  specialization TEXT,
  qualification TEXT,
  experience_years NUMERIC,
  consultation_fee NUMERIC,
  phone TEXT,
  address TEXT,
  availability TEXT, 
  profile_id UUID -- Removed strict FK
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Doctors Access" ON public.doctors;
CREATE POLICY "Public Doctors Access" ON public.doctors FOR ALL USING (true) WITH CHECK (true);


-- 3. SETUP STAFF TABLE
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'receptionist',
  phone TEXT,
  address TEXT,
  profile_id UUID REFERENCES public.profiles(id)
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Staff Access" ON public.staff;
CREATE POLICY "Public Staff Access" ON public.staff FOR ALL USING (true) WITH CHECK (true);


-- 4. SETUP WORKERS TABLE
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  role TEXT,
  phone TEXT,
  address TEXT,
  salary NUMERIC,
  profile_id UUID REFERENCES public.profiles(id)
);
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Workers Access" ON public.workers;
CREATE POLICY "Public Workers Access" ON public.workers FOR ALL USING (true) WITH CHECK (true);


-- 5. SETUP PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY,
  name TEXT,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  phone TEXT,
  address TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Patients Access" ON public.patients;
CREATE POLICY "Public Patients Access" ON public.patients FOR ALL USING (true) WITH CHECK (true);


-- 6. SETUP ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Admins Access" ON public.admins;
CREATE POLICY "Public Admins Access" ON public.admins FOR ALL USING (true) WITH CHECK (true);


-- =================================================================
-- SYNC DATA: FIX "ZOMBIE" ACCOUNTS (Missing Profiles)
-- =================================================================
INSERT INTO public.profiles (id, email, role, name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'patient'),
  COALESCE(raw_user_meta_data->>'displayName', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- SYNC DATA: POPULATE DOCTORS FROM PROFILES
-- =================================================================
-- If profiles exist but doctors don't, auto-create them to fix empty list.
INSERT INTO public.doctors (id, name, email, profile_id)
SELECT id, name, email, id 
FROM public.profiles 
WHERE role = 'doctor'
AND id NOT IN (SELECT id FROM public.doctors)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- SYNC DATA: POPULATE PATIENTS FROM PROFILES
-- =================================================================
INSERT INTO public.patients (id, name, email)
SELECT id, name, email
FROM public.profiles
WHERE role = 'patient'
AND id NOT IN (SELECT id FROM public.patients)
ON CONFLICT (id) DO NOTHING;


-- =================================================================
-- APPLY PERMISSIONS (POLICIES) - Authenticated
-- =================================================================
-- (Keeping these as fallback if RLS is re-enabled)

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Authenticated Select Profiles" ON public.profiles;
CREATE POLICY "Authenticated Select Profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Profiles" ON public.profiles;
CREATE POLICY "Authenticated Insert Profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Profiles" ON public.profiles;
CREATE POLICY "Authenticated Update Profiles" ON public.profiles FOR UPDATE TO authenticated USING (true);


-- 2. DOCTORS POLICIES
DROP POLICY IF EXISTS "Authenticated Select Doctors" ON public.doctors;
CREATE POLICY "Authenticated Select Doctors" ON public.doctors FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Doctors" ON public.doctors;
CREATE POLICY "Authenticated Insert Doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Doctors" ON public.doctors;
CREATE POLICY "Authenticated Update Doctors" ON public.doctors FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Delete Doctors" ON public.doctors;
CREATE POLICY "Authenticated Delete Doctors" ON public.doctors FOR DELETE TO authenticated USING (true);


-- 3. STAFF POLICIES
DROP POLICY IF EXISTS "Authenticated Select Staff" ON public.staff;
CREATE POLICY "Authenticated Select Staff" ON public.staff FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Staff" ON public.staff;
CREATE POLICY "Authenticated Insert Staff" ON public.staff FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Staff" ON public.staff;
CREATE POLICY "Authenticated Update Staff" ON public.staff FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Delete Staff" ON public.staff;
CREATE POLICY "Authenticated Delete Staff" ON public.staff FOR DELETE TO authenticated USING (true);


-- 4. WORKERS POLICIES
DROP POLICY IF EXISTS "Authenticated Select Workers" ON public.workers;
CREATE POLICY "Authenticated Select Workers" ON public.workers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Workers" ON public.workers;
CREATE POLICY "Authenticated Insert Workers" ON public.workers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Workers" ON public.workers;
CREATE POLICY "Authenticated Update Workers" ON public.workers FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Delete Workers" ON public.workers;
CREATE POLICY "Authenticated Delete Workers" ON public.workers FOR DELETE TO authenticated USING (true);


-- 5. PATIENTS POLICIES
DROP POLICY IF EXISTS "Authenticated Select Patients" ON public.patients;
CREATE POLICY "Authenticated Select Patients" ON public.patients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Patients" ON public.patients;
CREATE POLICY "Authenticated Insert Patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Patients" ON public.patients;
CREATE POLICY "Authenticated Update Patients" ON public.patients FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Delete Patients" ON public.patients;
CREATE POLICY "Authenticated Delete Patients" ON public.patients FOR DELETE TO authenticated USING (true);


-- 6. ADMINS POLICIES
DROP POLICY IF EXISTS "Authenticated Access Admins" ON public.admins;
CREATE POLICY "Authenticated Access Admins" ON public.admins FOR SELECT TO authenticated USING (true);
