-- Add all missing columns to medicines table
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS medicine_type TEXT,
ADD COLUMN IF NOT EXISTS manufacture_date DATE,
ADD COLUMN IF NOT EXISTS stock_coming_date DATE,
ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'medicines' 
AND table_schema = 'public'
ORDER BY ordinal_position;
