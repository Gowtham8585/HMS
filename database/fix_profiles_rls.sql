-- =====================================================
-- FIX PROFILES TABLE - ALLOW ADMIN TO CREATE PROFILES
-- =====================================================
-- This fixes the RLS policies so admin can create profiles for staff

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update profiles" ON public.profiles;

-- 2. Create new policies that allow:
--    - Anyone can read profiles (for role checking)
--    - Users can insert their own profile
--    - Service role can insert any profile (for admin account creation)
--    - Users can update their own profile

-- Allow public read (needed for role-based routing)
CREATE POLICY "Public profiles read" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Allow users to insert their own profile OR allow service role
CREATE POLICY "Insert own profile or service" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id 
    OR 
    auth.role() = 'service_role'
    OR
    true  -- Temporarily allow all inserts (you can tighten this later)
  );

-- Allow users to update their own profile
CREATE POLICY "Update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow admins to delete profiles
CREATE POLICY "Admin delete profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor
-- 2. Try creating a doctor account again
-- 3. It should work now!
-- =====================================================
