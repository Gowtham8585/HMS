
-- REBUILD SCHEMA V2 (User Requested)
-- WARNING: This will DROP existing data in these tables. 

-- 1. Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables to avoid conflicts (Cascade to remove FKs)
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.workers CASCADE;
DROP TABLE IF EXISTS public.medicines CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.hospital_settings CASCADE;

-- 3. Create Tables (Order matters for Foreign Keys)

-- PROFILES
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'patient'::text CHECK (role = ANY (ARRAY['patient'::text, 'doctor'::text, 'admin'::text, 'receptionist'::text, 'worker'::text, 'staff'::text])),
  specialization text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  address text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- PATIENTS
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE, -- Nullable user_id for non-app users
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])),
  blood_group text,
  address text,
  emergency_contact text,
  medical_history text,
  allergies text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT patients_pkey PRIMARY KEY (id),
  CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- DOCTORS
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  specialization text NOT NULL,
  qualification text,
  experience_years integer,
  consultation_fee numeric,
  available_days TEXT[], -- e.g. ['Mon', 'Tue']
  available_from time without time zone,
  available_to time without time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT doctors_pkey PRIMARY KEY (id),
  CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);

-- APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time without time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text, 'no-show'::text])),
  reason text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id),
  CONSTRAINT appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

-- MEDICAL RECORDS
CREATE TABLE public.medical_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid,
  appointment_id uuid,
  diagnosis text,
  prescription text,
  treatment text,
  vital_signs jsonb,
  lab_results jsonb,
  follow_up_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT medical_records_pkey PRIMARY KEY (id),
  CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT medical_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id),
  CONSTRAINT medical_records_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public MedRecords" ON public.medical_records FOR ALL USING (true) WITH CHECK (true);

-- WORKERS
CREATE TABLE public.workers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  status text DEFAULT 'active'::text,
  phone text,
  email text,
  address text,
  per_day_salary numeric DEFAULT 0,
  face_descriptor jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT workers_pkey PRIMARY KEY (id)
);
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);

-- ATTENDANCE
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  status text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT attendance_pkey PRIMARY KEY (id)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- MEDICINES
CREATE TABLE public.medicines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  medicine_name text,
  stock_quantity integer DEFAULT 0,
  expiry_date date,
  price numeric,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT medicines_pkey PRIMARY KEY (id)
);
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Medicines" ON public.medicines FOR ALL USING (true) WITH CHECK (true);

-- STAFF (Receptionist etc)
CREATE TABLE public.staff (
  id uuid NOT NULL, 
  name text,
  role text,
  shift text,
  phone text,
  address text,
  salary numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  email text,
  CONSTRAINT staff_pkey PRIMARY KEY (id)
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- ADMINS
CREATE TABLE public.admins (
  id uuid NOT NULL, 
  name text,
  phone text,
  address text,
  permissions jsonb DEFAULT '{"all": true}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  email text,
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

-- HOSPITAL SETTINGS
CREATE TABLE public.hospital_settings (
  id bigint NOT NULL, -- Singleton row ID = 1
  hospital_name text,
  address text,
  contact_number text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT hospital_settings_pkey PRIMARY KEY (id)
);
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Settings" ON public.hospital_settings FOR ALL USING (true) WITH CHECK (true);

-- DEFAULT HOSPITAL SETTINGS
INSERT INTO public.hospital_settings (id, hospital_name, address, contact_number)
VALUES (1, 'My Hospital', '123 Health St, Wellness City', '+91 00000 00000')
ON CONFLICT (id) DO NOTHING;

-- AUTO-SYNC PROFILES FROM AUTH (Recovery)
INSERT INTO public.profiles (user_id, email, role, full_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'patient'),
  COALESCE(raw_user_meta_data->>'displayName', email)
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- RECOVER DOCTORS FROM AUTH
INSERT INTO public.doctors (user_id, full_name, email, specialization, consultation_fee, available_days, available_from, available_to)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'displayName', email),
  email,
  'General Physician', -- Default
  500, -- Default fee
  ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], -- Default availability
  '09:00',
  '17:00'
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'doctor'
ON CONFLICT (user_id) DO NOTHING;

-- RECOVER PATIENTS FROM AUTH
INSERT INTO public.patients (user_id, full_name, email, phone)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'displayName', email),
  email,
  COALESCE(phone, 'N/A') -- Phone is required, fallback
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'patient'
ON CONFLICT (user_id) DO NOTHING;

-- RECOVER WORKERS FROM AUTH
INSERT INTO public.workers (id, name, role, email, phone)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'displayName', email),
  'Cleaner', -- Default role, user can update
  email,
  COALESCE(phone, 'N/A')
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'worker'
ON CONFLICT (id) DO NOTHING;

-- RECOVER STAFF FROM AUTH
INSERT INTO public.staff (id, name, role, email, phone)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'displayName', email),
  'Receptionist', -- Default
  email,
  COALESCE(phone, 'N/A')
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'receptionist' OR raw_user_meta_data->>'role' = 'staff'
ON CONFLICT (id) DO NOTHING;
