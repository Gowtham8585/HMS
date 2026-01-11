-- deep_diagnostic.sql
-- Run this to SEE what is actually in the database

-- 1. Count total attendance records
SELECT count(*) as total_attendance_records FROM public.attendance;

-- 2. Show the last 10 attendance records (Most recent first)
-- This will show us WHAT is being saved (if anything)
SELECT 
    a.id, 
    a.created_at, 
    a.user_id, 
    w.name as worker_name, 
    a.user_type, 
    a.check_in, 
    a.check_out, 
    a.status 
FROM public.attendance a
LEFT JOIN public.workers w ON a.user_id = w.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 3. Show all Workers (to verify IDs)
SELECT id, name, role FROM public.workers;

-- 4. Check RLS Policies (Security)
SELECT * FROM pg_policies WHERE tablename = 'attendance';
