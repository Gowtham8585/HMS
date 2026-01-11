-- Add specialization to profiles to store doctor's expertise at account level
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Update doctors table to support linking with auth profiles
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) NULL;

-- Ensure RLS is permissive for management
DROP POLICY IF EXISTS "Doctors public" ON public.doctors;
CREATE POLICY "Doctors public" ON public.doctors FOR ALL USING (true) WITH CHECK (true);
