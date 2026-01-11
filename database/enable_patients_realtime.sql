-- =====================================================
-- ENABLE REALTIME FOR PATIENTS TABLE
-- =====================================================
-- This ensures the admin patients list updates automatically
-- when receptionists register new patients

-- Enable Realtime publication for patients table
DO $$ 
BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE patients; 
EXCEPTION WHEN OTHERS THEN NULL; 
END $$;

-- Verify it's enabled (optional - just for checking)
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- =====================================================
-- INSTRUCTIONS:
-- 1. Run this script in Supabase SQL Editor
-- 2. Now when a receptionist registers a patient,
--    the admin's patient list will update automatically!
-- =====================================================
