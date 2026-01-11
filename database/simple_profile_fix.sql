-- =====================================================
-- SIMPLE FIX - ALLOW PROFILE INSERTS
-- =====================================================
-- This just updates the insert policy to allow profile creation

-- Drop and recreate ONLY the insert policy
DROP POLICY IF EXISTS "Insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile or service" ON public.profiles;

-- Allow anyone to insert profiles (needed for admin account creation)
CREATE POLICY "Allow profile inserts" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);

-- That's it! Now try creating a doctor account again.
