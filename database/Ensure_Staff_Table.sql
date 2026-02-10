
-- Ensure tables exist for all roles, including staff for receptionists

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid NOT NULL REFERENCES auth.users(id),
  name text,
  role text DEFAULT 'Receptionist'::text,
  email text,
  phone text,
  address text,
  salary numeric DEFAULT 0,
  shift text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  place text, -- Adding potential missing columns
  CONSTRAINT staff_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Allow Admins to Manage Staff
CREATE POLICY "Admins Manage Staff" ON public.staff FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) 
  OR 
  (auth.jwt() ->> 'email' LIKE '%admin%') -- Fallback for super admin
);
