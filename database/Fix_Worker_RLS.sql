
-- 1. FIX RLS FOR WORKERS
-- Allow Admins (by email check or existing admin check) to manage workers
DROP POLICY IF EXISTS "Admins Manage Workers" ON public.workers;
CREATE POLICY "Admins Manage Workers" ON public.workers FOR ALL TO authenticated USING (
  EXISTS(SELECT 1 FROM public.admins WHERE id = auth.uid()) OR (auth.jwt() ->> 'email' = 'admin@gmail.com')
);

-- 2. Ensure Workers Table Exists properly (with email column)
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS email text;

-- 3. Ensure no recursion on policies
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
