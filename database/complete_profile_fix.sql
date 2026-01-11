-- =====================================================
-- CHECK AND FIX PROFILES TABLE STRUCTURE
-- =====================================================

-- 1. First, let's see what columns exist in profiles
-- Run this to check:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- 2. Add missing columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization text;

-- 3. Completely disable RLS temporarily for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. Re-enable it with a simple "allow all" policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile or service" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile inserts" ON public.profiles;
DROP POLICY IF EXISTS "Update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin delete profiles" ON public.profiles;

-- Create simple "allow everything" policies for testing
CREATE POLICY "Allow all reads" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON public.profiles FOR DELETE USING (true);

-- =====================================================
-- This completely opens up the profiles table
-- Try creating a doctor account after running this
-- =====================================================
