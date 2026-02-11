-- Add missing manufacture_date column to medicines table
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS manufacture_date DATE;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medicines' 
AND table_schema = 'public'
ORDER BY ordinal_position;
