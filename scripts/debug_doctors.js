
import { createClient } from "@supabase/supabase-js";

// KNOWN WORKING CREDENTIALS
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";

const supabase = createClient(url, key);

async function debugDoctors() {
    console.log("--- DEBUGGING DOCTORS (With Anon Key) ---");

    // 1. Fetch Doctors
    console.log(`\n1. Fetching doctors...`);
    const { data: doctors, error } = await supabase.from('doctors').select('*');

    if (error) {
        console.error("❌ Error fetching doctors:", error.message);
    } else {
        console.log(`✅ Success. Found ${doctors.length} doctors.`);
        if (doctors.length > 0) {
            console.table(doctors.map(d => ({ id: d.id, name: d.name, email: d.email })));
        } else {
            console.log("   (Table returns empty array)");
        }
    }

    // 2. Fetch Profiles (ALL)
    console.log(`\n2. Fetching ALL profiles...`);
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error("❌ Error fetching profiles:", pError.message);
    } else {
        console.log(`✅ Found ${profiles.length} total profiles.`);
        if (profiles.length > 0) {
            console.log(JSON.stringify(profiles.map(p => ({ id: p.id, role: p.role, email: p.email })), null, 2));
        }
    }
}

debugDoctors();
