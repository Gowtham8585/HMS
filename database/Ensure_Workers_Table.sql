
-- Ensure Workers Table Exists and has correct structure
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  role text NOT NULL,
  status text DEFAULT 'active'::text,
  per_day_salary numeric,
  phone text,
  address text,
  join_date date DEFAULT CURRENT_DATE,
  face_descriptor jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  email text,
  CONSTRAINT workers_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Allow Admins to Manage Workers
DROP POLICY IF EXISTS "Admins Manage Workers" ON public.workers;
CREATE POLICY "Admins Manage Workers" ON public.workers FOR ALL TO authenticated USING (
  EXISTS(SELECT 1 FROM public.admins WHERE id = auth.uid()) 
  OR 
  (auth.jwt() ->> 'email' LIKE '%admin%') 
  OR 
  (auth.jwt() ->> 'email' = 'admin@gmail.com')
);

-- Allow Workers to Read Self
DROP POLICY IF EXISTS "Workers Read Self" ON public.workers;
CREATE POLICY "Workers Read Self" ON public.workers FOR SELECT TO authenticated USING (auth.uid() = id);
