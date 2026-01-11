-- Add more columns to patients table
alter table public.patients 
add column if not exists blood_group text,
add column if not exists weight text,
add column if not exists height text,
add column if not exists address text,
add column if not exists emergency_contact_phone text;
