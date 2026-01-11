-- =====================================================
-- RESET DOCTORS TABLE - ADMIN-ONLY MANAGEMENT
-- =====================================================
-- This script removes the old doctors table and creates a fresh one
-- where doctors are ONLY created by admin through Staff Accounts page.
-- Doctors will log in using email/password provided by admin.

-- 1. Drop the old doctors table completely
DROP TABLE IF EXISTS public.doctors CASCADE;

-- 2. Create a fresh doctors table (linked to auth profiles)
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialization text,
  availability text,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Allow public read, admin-only write)
DROP POLICY IF EXISTS "Doctors public read" ON public.doctors;
CREATE POLICY "Doctors public read" 
  ON public.doctors 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Doctors admin write" ON public.doctors;
CREATE POLICY "Doctors admin write" 
  ON public.doctors 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 5. Enable Realtime for live updates
DO $$ 
BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE doctors; 
EXCEPTION WHEN OTHERS THEN NULL; 
END $$;

-- 6. Add helpful comment
COMMENT ON TABLE public.doctors IS 'Doctors directory - managed exclusively by admin through Staff Accounts page';

-- =====================================================
-- INSTRUCTIONS:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Go to Admin Dashboard > Staff Accounts
-- 3. Create doctor accounts with email/password
-- 4. Doctors log in using those credentials
-- =====================================================
