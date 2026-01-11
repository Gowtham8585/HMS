-- Add missing columns to doctors table to support registration form fields
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 500;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT '';

-- Add comment
COMMENT ON COLUMN public.doctors.consultation_fee IS 'Consultation fee in Rupees';
COMMENT ON COLUMN public.doctors.experience_years IS 'Number of years of medical experience';
COMMENT ON COLUMN public.doctors.qualification IS 'Medical qualifications (MBBS, MD, etc)';
