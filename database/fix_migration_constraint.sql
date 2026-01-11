-- Fix for Constraint Error during Migration
-- The error happened because 'receptionist' wasn't a valid value in the existing check constraint.

-- 1. Drop the old constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add the new constraint with 'receptionist' included
-- We include 'coworker' still to allow existing rows before update, and 'receptionist' for the new rows.
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient', 'coworker'));

-- 3. Now run the data update safely
UPDATE public.profiles
SET role = 'receptionist'
WHERE role = 'coworker';

-- 4. (Optional) You can now remove 'coworker' from the constraint if you want strict enforcement
-- ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient'));
