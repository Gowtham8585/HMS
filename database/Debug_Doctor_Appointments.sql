-- Debug script to check doctor appointments issue

-- 1. Check all doctors in profiles table
SELECT 'DOCTORS IN PROFILES:' as info;
SELECT id, user_id, full_name, role, specialization
FROM public.profiles
WHERE role = 'doctor';

-- 2. Check all appointments
SELECT 'ALL APPOINTMENTS:' as info;
SELECT id, doctor_id, patient_id, appointment_date, appointment_time, status
FROM public.appointments
ORDER BY appointment_date DESC;

-- 3. Check if doctor_id matches any profile
SELECT 'APPOINTMENTS WITH DOCTOR NAMES:' as info;
SELECT 
    a.id,
    a.doctor_id,
    p.full_name as doctor_name,
    a.patient_id,
    a.appointment_date,
    a.appointment_time,
    a.status
FROM public.appointments a
LEFT JOIN public.profiles p ON a.doctor_id = p.id
ORDER BY a.appointment_date DESC;

-- 4. Check foreign key constraint
SELECT 'FOREIGN KEY CONSTRAINTS:' as info;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'appointments' 
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'doctor_id';

-- 5. Check RLS policies on appointments
SELECT 'RLS POLICIES ON APPOINTMENTS:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'appointments';
