
-- Relax the rule on 'role' column in profiles to allow all types
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'doctor', 'receptionist', 'staff', 'patient', 'worker'));

-- Add 'profile_id' to doctors just in case legacy code uses it, 
-- though 'id' is the real link. (Optional, but safe).
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id);
