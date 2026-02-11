
-- 0. CREATE PROFILES IF NOT EXISTS (Basic Version)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    role TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Enable RLS on profiles if we just created it
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
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
  profile_id UUID REFERENCES public.profiles(id)
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated Select Doctors" ON public.doctors;
CREATE POLICY "Authenticated Select Doctors" ON public.doctors FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Doctors" ON public.doctors;
CREATE POLICY "Authenticated Insert Doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Doctors" ON public.doctors;
CREATE POLICY "Authenticated Update Doctors" ON public.doctors FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Delete Doctors" ON public.doctors;
CREATE POLICY "Authenticated Delete Doctors" ON public.doctors FOR DELETE TO authenticated USING (true);


-- 2. STAFF TABLE
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

DROP POLICY IF EXISTS "Authenticated Select Staff" ON public.staff;
CREATE POLICY "Authenticated Select Staff" ON public.staff FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Staff" ON public.staff;
CREATE POLICY "Authenticated Insert Staff" ON public.staff FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Staff" ON public.staff;
CREATE POLICY "Authenticated Update Staff" ON public.staff FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Delete Staff" ON public.staff;
CREATE POLICY "Authenticated Delete Staff" ON public.staff FOR DELETE TO authenticated USING (true);


-- 3. WORKERS TABLE
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

DROP POLICY IF EXISTS "Authenticated Select Workers" ON public.workers;
CREATE POLICY "Authenticated Select Workers" ON public.workers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Workers" ON public.workers;
CREATE POLICY "Authenticated Insert Workers" ON public.workers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Workers" ON public.workers;
CREATE POLICY "Authenticated Update Workers" ON public.workers FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Delete Workers" ON public.workers;
CREATE POLICY "Authenticated Delete Workers" ON public.workers FOR DELETE TO authenticated USING (true);


-- 4. PROFILES TABLE POLICIES
DROP POLICY IF EXISTS "Authenticated Select Profiles" ON public.profiles;
CREATE POLICY "Authenticated Select Profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Profiles" ON public.profiles;
CREATE POLICY "Authenticated Insert Profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Update Profiles" ON public.profiles;
CREATE POLICY "Authenticated Update Profiles" ON public.profiles FOR UPDATE TO authenticated USING (true);

-- 5. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated Access Admins" ON public.admins;
CREATE POLICY "Authenticated Access Admins" ON public.admins FOR SELECT TO authenticated USING (true);
