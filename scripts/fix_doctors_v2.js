
import { createClient } from "@supabase/supabase-js";

// KNOWN WORKING CREDENTIALS (ANON KEY)
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";

const supabase = createClient(url, key);

async function fixDoctors() {
    console.log("🛠️ Starting Doctor Data Recovery...");

    // 1. Get all profiles marked as doctors
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor');

    if (pError) {
        console.error("❌ Failed to fetch profiles:", pError.message);
        return;
    }

    console.log(`found ${profiles.length} 'doctor' profiles.`);

    for (const p of profiles) {
        console.log(`\n👉 Processing ${p.name} (${p.email})...`);

        // Check if already in doctors
        const { data: existing } = await supabase.from('doctors').select('id').eq('id', p.id).single();

        if (existing) {
            console.log(`   ✅ Already exists in 'doctors' table.`);
            continue;
        }

        console.log(`   ⚠️ Missing from 'doctors'. Attempting restore...`);

        // Construct basic doctor record from profile
        const newDoc = {
            id: p.id,
            name: p.name || p.email.split('@')[0],
            email: p.email,
            specialization: "General Physician", // Default
            availability: "Full Time (Mon-Sat, 9AM-5PM)", // Default
            profile_id: p.id
        };

        const { error: insertError } = await supabase.from('doctors').upsert(newDoc);

        if (insertError) {
            console.error(`   ❌ Insert Failed: ${insertError.message}`);
            console.error("   Details:", insertError);
        } else {
            console.log(`   ✅ RESTORED SUCCESSFULLY!`);
        }
    }
}

fixDoctors();
