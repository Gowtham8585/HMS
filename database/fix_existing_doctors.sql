-- =====================================================
-- FIX EXISTING DOCTOR ACCOUNTS
-- =====================================================
-- This script helps link existing doctor auth accounts 
-- to the doctors directory table

-- STEP 1: See which doctor accounts exist in auth/profiles but not in doctors table
-- Run this first to see what needs to be fixed:

SELECT 
    p.id,
    p.name,
    p.email,
    p.specialization,
    CASE 
        WHEN d.id IS NULL THEN '❌ Missing from doctors table'
        ELSE '✅ Already in doctors table'
    END as status
FROM profiles p
LEFT JOIN doctors d ON p.id = d.id
WHERE p.role = 'doctor'
ORDER BY p.created_at DESC;

-- STEP 2: If you see doctors with "❌ Missing from doctors table",
-- copy their information and run this INSERT for each one:

-- EXAMPLE (replace with actual values from STEP 1):
/*
INSERT INTO public.doctors (id, name, specialization, availability, profile_id)
VALUES (
  'PASTE_USER_ID_HERE',           -- From STEP 1 result
  'Dr. Salman',                    -- From STEP 1 result
  'Cardiologist',                  -- From STEP 1 result or choose one
  'Full Time (Mon-Sat, 9AM-5PM)',  -- Default availability
  'PASTE_USER_ID_HERE'             -- Same as id
)
ON CONFLICT (id) DO NOTHING;
*/

-- STEP 3: After inserting, verify it worked:
SELECT 
    d.name,
    d.specialization,
    d.availability,
    p.email
FROM doctors d
JOIN profiles p ON d.id = p.id
WHERE p.role = 'doctor'
ORDER BY d.name;

-- =====================================================
-- QUICK FIX: Auto-insert ALL missing doctors
-- =====================================================
-- If you want to automatically fix ALL doctors at once, run this:

INSERT INTO public.doctors (id, name, specialization, availability, profile_id)
SELECT 
    p.id,
    p.name,
    COALESCE(p.specialization, 'General Physician'),
    'Full Time (Mon-Sat, 9AM-5PM)',
    p.id
FROM profiles p
LEFT JOIN doctors d ON p.id = d.id
WHERE p.role = 'doctor' AND d.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- After running this, refresh your Doctors List page!
-- =====================================================
