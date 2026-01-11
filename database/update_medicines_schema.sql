-- Add medicine_type to medicines table
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS medicine_type TEXT DEFAULT 'General';

-- Update RLS if needed (usually already on for the table)
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Medicines public" ON public.medicines;
CREATE POLICY "Medicines public" ON public.medicines FOR ALL USING (true);
