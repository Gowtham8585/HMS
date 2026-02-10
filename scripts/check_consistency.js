
import { createClient } from "@supabase/supabase-js";

// Init Supabase
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";
const supabase = createClient(url, key);

async function checkConsistency() {
    console.log("🔍 Checking Database Consistency...");

    // 1. Check Admins
    console.log("\n--- ADMINS ---");
    const { data: adminProfiles } = await supabase.from('profiles').select('*').eq('role', 'admin');
    const { data: adminTable } = await supabase.from('admins').select('*');

    console.log(`Profiles says: ${adminProfiles.length} Admins`);
    console.log(`Admins Table says: ${adminTable.length} Admins`);

    for (const p of adminProfiles) {
        const inTable = adminTable.find(a => a.id === p.id);
        if (!inTable) {
            console.log(`⚠️  Admin ${p.email} is in Profiles but NOT in Admins table. Fixing...`);
            await supabase.from('admins').insert([{ id: p.id, name: p.name }]);
            console.log("   ✔ Fixed.");
        } else {
            console.log(`✅  Admin ${p.email} is correctly in both tables.`);
        }
    }

    // 2. Check Doctors
    console.log("\n--- DOCTORS ---");
    const { data: docProfiles } = await supabase.from('profiles').select('*').eq('role', 'doctor');
    const { data: docTable } = await supabase.from('doctors').select('*');

    console.log(`Profiles says: ${docProfiles.length} Doctors`);
    console.log(`Doctors Table says: ${docTable.length} Doctors`);

    for (const p of docProfiles) {
        const inTable = docTable.find(d => d.id === p.id);
        if (!inTable) {
            console.log(`⚠️  Doctor ${p.email} is in Profiles but NOT in Doctors table. Fixing...`);
            await supabase.from('doctors').insert([{ id: p.id, name: p.name, email: p.email }]);
            console.log("   ✔ Fixed.");
        } else {
            console.log(`✅  Doctor ${p.email} is correctly in both tables.`);
        }
    }

    // 3. Check Receptionists (in 'staff' table typically, or 'receptionists' if separated)
    // Check schema... usually mapped to 'staff' or 'receptionists'? 
    // Let's assume 'staff' for now or skip if schema ambiguous.
}

checkConsistency();
