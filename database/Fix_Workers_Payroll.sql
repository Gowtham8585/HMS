-- Add missing payroll columns to workers table
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS per_day_salary numeric DEFAULT 0;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- IMPORTANT: After running this, if the error persists, 
-- go to Supabase Dashboard -> Project Settings -> API 
-- and click 'Reload Schema Cache' or 'Clear Cache'.
