
import { createClient } from "@supabase/supabase-js";

// KNOWN WORKING CREDENTIALS (ANON KEY)
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";

const supabase = createClient(url, key);

async function fixPatients() {
    console.log("🛠️ Starting Patient Data Recovery...");

    // 1. Get all profiles marked as patient
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient');

    if (pError) {
        console.error("❌ Failed to fetch profiles:", pError.message);
        return;
    }

    console.log(`found ${profiles.length} 'patient' profiles.`);

    for (const p of profiles) {
        console.log(`\n👉 Processing ${p.name} (${p.email})...`);

        // Check if already in patients
        const { data: existing } = await supabase.from('patients').select('id').eq('id', p.id).single();

        if (existing) {
            console.log(`   ✅ Already exists in 'patients' table.`);
            continue;
        }

        console.log(`   ⚠️ Missing from 'patients'. Attempting restore...`);

        // Construct basic patient record from profile
        const newPatient = {
            id: p.id,
            name: p.name || p.email.split('@')[0],
            // Default fields as per schema if they are not nullable
            // looking at previous user pasted schema:
            // age, gender, blood_group, weight, height, phone, address, emergency_contact_phone, medical_history seem optional or nullable?
            // User schema shows:
            // id uuid NOT NULL,
            // name text,
            // ... (others specific types but not explicitly NOT NULL except id and created_at usually)
            // Let's try inserting with basic info first.
        };

        const { error: insertError } = await supabase.from('patients').upsert(newPatient);

        if (insertError) {
            console.error(`   ❌ Insert Failed: ${insertError.message}`);
            console.error("   Details:", insertError);
        } else {
            console.log(`   ✅ RESTORED SUCCESSFULLY!`);
        }
    }
}

fixPatients();
