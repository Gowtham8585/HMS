-- =====================================================
-- FIX EXISTING DOCTOR ACCOUNT - ADD MISSING PROFILE
-- =====================================================
-- This script manually creates the profile for doctor@gmail.com
-- Replace the email and details with your actual doctor's information

-- STEP 1: Find the user ID for doctor@gmail.com
-- Run this query first to get the user's ID:
-- SELECT id, email FROM auth.users WHERE email = 'doctor@gmail.com';

-- STEP 2: Once you have the ID, replace 'USER_ID_HERE' below with the actual UUID
-- Then run the INSERT statement

-- Example: If the ID is '123e4567-e89b-12d3-a456-426614174000', replace it below

-- INSERT the missing profile (REPLACE THE VALUES BELOW)
INSERT INTO public.profiles (id, name, email, role, specialization)
VALUES (
  'USER_ID_HERE',  -- Replace with actual user ID from STEP 1
  'Dr. Salman',    -- Replace with actual doctor name
  'doctor@gmail.com',  -- Replace with actual email
  'doctor',        -- Keep as 'doctor'
  'Dermatologist'  -- Replace with actual specialization
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  specialization = EXCLUDED.specialization;

-- STEP 3: Also add to doctors table
INSERT INTO public.doctors (id, name, specialization, availability, profile_id)
VALUES (
  'USER_ID_HERE',  -- Same user ID as above
  'Dr. Salman',    -- Same name
  'Dermatologist', -- Same specialization
  'Full Time (Mon-Sat, 9AM-5PM)',
  'USER_ID_HERE'   -- Same user ID
)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  specialization = EXCLUDED.specialization,
  availability = EXCLUDED.availability;

-- =====================================================
-- QUICK INSTRUCTIONS:
-- 1. Run: SELECT id, email FROM auth.users WHERE email = 'doctor@gmail.com';
-- 2. Copy the 'id' value
-- 3. Replace all 'USER_ID_HERE' above with that ID
-- 4. Update the name/email/specialization if needed
-- 5. Run the INSERT statements
-- 6. Try logging in again!
-- =====================================================
