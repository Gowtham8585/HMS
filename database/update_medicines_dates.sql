-- Add manufacture_date and stock_coming_date to medicines table
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS manufacture_date DATE;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS stock_coming_date DATE DEFAULT CURRENT_DATE;

-- Ensure permissions are set
GRANT ALL ON public.medicines TO anon, authenticated;
