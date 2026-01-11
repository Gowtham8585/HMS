-- fix_workers_access.sql

-- 1. Force Enable RLS (Row Level Security)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all for workers" ON public.workers;
DROP POLICY IF EXISTS "Allow read access" ON public.workers;
DROP POLICY IF EXISTS "Allow write access" ON public.workers;

-- 3. Create a PERMISSIVE policy for now
-- This allows any user (anon or authenticated) to Read/Write workers.
-- Crucial for the Face Scanner to fetch descriptors and update attendance.
CREATE POLICY "Enable all access" 
ON public.workers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Verify face_descriptor column
-- Just in case it was missed, we try to add it again.
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS face_descriptor jsonb;

-- 5. Fix Attendance Policies too
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access" ON public.attendance;

CREATE POLICY "Enable all access" 
ON public.attendance 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 6. Grant usage to anon/authenticated roles (Supabase defaults)
GRANT ALL ON public.workers TO anon;
GRANT ALL ON public.workers TO authenticated;
GRANT ALL ON public.attendance TO anon;
GRANT ALL ON public.attendance TO authenticated;

