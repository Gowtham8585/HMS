-- final_fix_all.sql
-- Force everything to be open and correct.

-- 1. FIX COLUMNS (Repeat just in case)
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out TIMESTAMP WITH TIME ZONE;

-- 2. FIX PERMISSIONS (The biggest suspect)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Drop generic policies
DROP POLICY IF EXISTS "Enable all for workers" ON public.workers;
DROP POLICY IF EXISTS "Enable all for attendance" ON public.attendance;
DROP POLICY IF EXISTS "allow_anon_select" ON public.workers;
DROP POLICY IF EXISTS "allow_anon_insert" ON public.workers;
DROP POLICY IF EXISTS "allow_anon_update" ON public.workers;
DROP POLICY IF EXISTS "allow_anon_select_att" ON public.attendance;
DROP POLICY IF EXISTS "allow_anon_insert_att" ON public.attendance;
DROP POLICY IF EXISTS "allow_anon_update_att" ON public.attendance;

-- Create BLANKET policies (Anon + Authenticated)
CREATE POLICY "Public Workers Read" ON public.workers FOR SELECT USING (true);
CREATE POLICY "Public Workers Write" ON public.workers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Workers Update" ON public.workers FOR UPDATE USING (true);

CREATE POLICY "Public Attendance Read" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Public Attendance Write" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Attendance Update" ON public.attendance FOR UPDATE USING (true);

-- Grant privileges to anon role specifically
GRANT ALL ON TABLE public.workers TO anon;
GRANT ALL ON TABLE public.attendance TO anon;
GRANT ALL ON TABLE public.workers TO authenticated;
GRANT ALL ON TABLE public.attendance TO authenticated;

-- 3. VERIFY
SELECT 'Permissions Fixed' as status;
