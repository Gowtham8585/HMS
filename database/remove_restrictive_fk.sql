-- remove_restrictive_fk.sql

-- The error "violates foreign key constraint attendance_user_id_fkey" happens because
-- the database thinks "user_id" MUST belong to a specific table (likely auth.users or profiles).
-- But Workers are in a different table ('workers'). 
-- Since 'attendance' handles BOTH, we must remove this restriction.

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS "attendance_user_id_fkey";
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS "attendance_userId_fkey";

-- Verify it's gone
SELECT conname 
FROM pg_constraint 
WHERE conname LIKE 'attendance_%';
