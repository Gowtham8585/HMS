import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking doctors table...");
  const { data: doctors } = await supabase.from('doctors').select('id').limit(1);
  const doctorId = doctors?.[0]?.id;
  console.log("Doctor ID:", doctorId);

  console.log("Checking profiles table...");
  const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'doctor').limit(1);
  const profileId = profiles?.[0]?.id;
  console.log("Profile ID:", profileId);

  console.log("Checking patients table...");
  const { data: patients } = await supabase.from('patients').select('id').limit(1);
  const patientId = patients?.[0]?.id;
  console.log("Patient ID:", patientId);

  if (doctorId && patientId) {
    console.log("Trying to insert with doctors.id...");
    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: '2026-01-01',
      appointment_time: '10:00',
      status: 'scheduled'
    });
    console.log("Insert with doctors.id error:", error?.message || "SUCCESS");
  }

  if (profileId && patientId) {
    console.log("Trying to insert with profiles.id...");
    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      doctor_id: profileId,
      appointment_date: '2026-01-01',
      appointment_time: '11:00',
      status: 'scheduled'
    });
    console.log("Insert with profiles.id error:", error?.message || "SUCCESS");
  }
}

check().catch(console.error);
