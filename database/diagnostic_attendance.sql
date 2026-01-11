-- diagnostic_attendance.sql
-- Check if the attendance table has the expected columns and recent data

-- 1. Check Table Columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendance';

-- 2. Check Recent Attendance Records (Last 5)
SELECT id, user_id, user_type, date, check_in, check_out, in_time, out_time, status
FROM public.attendance
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check Workers
SELECT id, name, role FROM public.workers LIMIT 5;
