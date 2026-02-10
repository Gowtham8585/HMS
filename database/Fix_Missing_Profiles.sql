
-- =================================================================
-- REPAIR SCRIPT: SYNC PROFILES FROM AUTH METADATA
-- =================================================================
-- This script fixes "Zombie" accounts that exist in Auth but missing in Profiles
-- (Common cause: RLS errors during registration)

INSERT INTO public.profiles (id, email, role, name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'patient'), -- Fallback to patient if null
  COALESCE(raw_user_meta_data->>'displayName', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Also ensure the specific role tables have entries (Best Effort)
-- insert into public.doctors (id, name, profile_id) select id, name, id from public.profiles where role = 'doctor' on conflict do nothing;
-- insert into public.staff (id, name) select id, name from public.profiles where role = 'receptionist' on conflict do nothing;
-- insert into public.workers (id, name) select id, name from public.profiles where role = 'worker' on conflict do nothing;
