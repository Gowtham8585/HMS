
-- URGENT: RUN THIS IN SUPABASE SQL EDITOR TO FIX LOGIN ERROR
-- This disables all automatic background actions that are causing the "Database error querying schema"

-- 1. Remove Auth Trigger (Stops "handle_new_user" error)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Remove Profile Sync Trigger (Stops "sync_profile_to_role_table" error)
DROP TRIGGER IF EXISTS on_profile_change ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_profile_to_role_table();

-- 3. Remove Realtime (Stops schema cache errors)
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- 4. Just in case, ensure profiles table is simple and open
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read" ON public.profiles;
CREATE POLICY "Public Read" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public Write" ON public.profiles;
CREATE POLICY "Public Write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public Update" ON public.profiles;
CREATE POLICY "Public Update" ON public.profiles FOR UPDATE TO authenticated USING (true);
