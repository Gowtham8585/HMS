# Clinic Management System

## Setup
1. Copy `.env.example` to `.env.local` and add your `VITE_SUPABASE_KEY`.
   - Data handling relies on Supabase.
2. Run `npm install`.
3. Run `npm run dev` to start the application.

## Features
- **Admin**: Manage Staff, Patients, Inventory, Reports.
- **Doctor**: View appointments, Add Diagnosis, Prescribe Meds (Real-time stock deduction).
- **Staff**: Register Patients, Book Appointments, Update Stock.
- **Patient**: View status, Prescriptions.

## Supabase Tables Required
Ensure your Supabase project has the following tables:
- `profiles` (id, name, email, role)
- `doctors` (id, name, specialization, availability)
- `patients` (id, name, age, gender, phone, medical_history)
- `appointments` (id, patient_id, doctor_id, appointment_date, status)
- `medicines` (id, medicine_name, stock_quantity, expiry_date, price)
- `medicine_usage` (id, patient_id, medicine_id, quantity_used, date)

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Supabase (Auth + Database + Realtime)
