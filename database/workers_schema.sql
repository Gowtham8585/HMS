-- workers_schema.sql
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create Workers Table (for staff without login)
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Worker',
    per_day_salary NUMERIC DEFAULT 0,
    phone TEXT,
    address TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Attendance Table (to track both profiles and workers)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- This links to either profiles(id) or workers(id)
    user_type TEXT CHECK (user_type IN ('doctor', 'coworker', 'worker')),
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'present',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Policies (Allows your app to read/write)
-- Note: In production, you should restrict these to authenticated users only.
CREATE POLICY "Enable all for workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable Realtime (so dashboard updates instantly)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE workers, attendance;
COMMIT;
