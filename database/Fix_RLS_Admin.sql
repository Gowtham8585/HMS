
-- 1. Enable Full Access for Admins to Profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- 2. Allow Admins to insert ANY profile (needed for registration)
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
CREATE POLICY "Admins can insert any profile"
ON public.profiles
FOR INSERT
WITH CHECK (
    -- Allow if the *current user* is an admin
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    -- OR allow users to insert their own (for self-signup)
    OR auth.uid() = id
);
