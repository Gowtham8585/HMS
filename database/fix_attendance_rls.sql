-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Remove conflicting policies (including the ones we are about to create to avoid errors)
DROP POLICY IF EXISTS "Enable insert for all" ON public.attendance;
DROP POLICY IF EXISTS "Enable update for all" ON public.attendance;
DROP POLICY IF EXISTS "Enable all access for all" ON public.attendance;
DROP POLICY IF EXISTS "Attendance access" ON public.attendance;
DROP POLICY IF EXISTS "Allow Select All" ON public.attendance;
DROP POLICY IF EXISTS "Allow Insert All" ON public.attendance;
DROP POLICY IF EXISTS "Allow Update All" ON public.attendance;
DROP POLICY IF EXISTS "Allow Delete All" ON public.attendance;

-- Create comprehensive permissive policies for the anon key (used by Python script)
-- Allow SELECT for everyone (needed for dashboard and script)
CREATE POLICY "Allow Select All" 
ON public.attendance 
FOR SELECT 
USING (true);

-- Allow INSERT for everyone (needed for script)
CREATE POLICY "Allow Insert All" 
ON public.attendance 
FOR INSERT 
WITH CHECK (true);

-- Allow UPDATE for everyone (needed for script check-out)
CREATE POLICY "Allow Update All" 
ON public.attendance 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow DELETE (optional, good for cleanup)
CREATE POLICY "Allow Delete All" 
ON public.attendance 
FOR DELETE 
USING (true);

-- Grant permissions just in case
GRANT ALL ON public.attendance TO anon, authenticated, service_role;
