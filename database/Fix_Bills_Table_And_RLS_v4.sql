-- Ensure bills table exists
CREATE TABLE IF NOT EXISTS public.bills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  total_amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bills_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to clear conflicts
DROP POLICY IF EXISTS "Allow admin select all bills" ON public.bills;
DROP POLICY IF EXISTS "Public Bills" ON public.bills;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bills;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.bills;

-- Create comprehensive policy
CREATE POLICY "Enable all access for authenticated users"
ON public.bills
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix bill_items permissions as well just in case
CREATE TABLE IF NOT EXISTS public.bill_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES public.bills(id) ON DELETE CASCADE,
  item_name text,
  quantity integer,
  unit_price numeric,
  subtotal numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bill_items_pkey PRIMARY KEY (id)
);

ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.bill_items;

CREATE POLICY "Enable all access for authenticated users"
ON public.bill_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
