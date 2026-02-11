
import { createClient } from "@supabase/supabase-js";

// KNOWN WORKING CREDENTIALS (ANON KEY)
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";

const supabase = createClient(url, key);

async function debugPatients() {
    console.log("--- DEBUGGING PATIENTS LIST ---");

    // 1. Fetch Patients
    console.log(`\n1. Fetching patients...`);
    const { data: patients, error } = await supabase.from('patients').select('*');

    if (error) {
        console.error("❌ Error fetching patients:", error.message);
    } else {
        console.log(`✅ Success. Found ${patients.length} patients.`);
        if (patients.length > 0) {
            console.log(JSON.stringify(patients.map(p => ({ id: p.id, name: p.name, email: p.email })), null, 2));
        } else {
            console.log("   (Table returns empty array)");
        }
    }

    // 2. Fetch Profiles with role='patient'
    console.log(`\n2. Fetching profiles with role='patient'...`);
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').eq('role', 'patient');
    if (pError) {
        console.error("❌ Error fetching profiles:", pError.message);
    } else {
        console.log(`✅ Found ${profiles.length} profiles with role='patient'.`);
        if (profiles.length > 0) {
            console.log(JSON.stringify(profiles.map(p => ({ id: p.id, name: p.name, email: p.email })), null, 2));
        }
    }
}

debugPatients();
