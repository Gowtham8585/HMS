-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES auth.users(id), -- Or profiles, but appointments uses doctor_id as user id usually
    patient_id UUID REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id), -- Optional, can be null for quick prescribe if we don't link strictly
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescription_items table
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    quantity INTEGER DEFAULT 1,
    instructions TEXT, -- e.g. "After food"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now, allow authenticated to read/write)
CREATE POLICY "Enable all access for authenticated users" ON prescriptions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON prescription_items FOR ALL USING (auth.role() = 'authenticated');
