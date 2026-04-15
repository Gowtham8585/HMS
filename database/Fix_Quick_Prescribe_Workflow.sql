-- 1. Ensure medicine_usage table exists
CREATE TABLE IF NOT EXISTS public.medicine_usage (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL,
    quantity_used integer DEFAULT 1,
    date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT medicine_usage_pkey PRIMARY KEY (id)
);
ALTER TABLE public.medicine_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctors can insert usage" ON public.medicine_usage;
CREATE POLICY "Doctors can insert usage" ON public.medicine_usage FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Doctors can select usage" ON public.medicine_usage;
CREATE POLICY "Doctors can select usage" ON public.medicine_usage FOR SELECT TO authenticated USING (true);


-- 2. Ensure prescriptions table exists
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT prescriptions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctors can manage prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can manage prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 3. Ensure prescription_items table exists
CREATE TABLE IF NOT EXISTS public.prescription_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL,
    quantity integer DEFAULT 1,
    instructions text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT prescription_items_pkey PRIMARY KEY (id)
);
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Doctors can manage prescription items" ON public.prescription_items;
CREATE POLICY "Doctors can manage prescription items" ON public.prescription_items FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 4. Check Patients Updates (Medical History)
-- Make sure doctors can update patients (specifically medical_history)
DROP POLICY IF EXISTS "Doctors can update patients" ON public.patients;
CREATE POLICY "Doctors can update patients" ON public.patients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 5. Helper Index (Optional)
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
