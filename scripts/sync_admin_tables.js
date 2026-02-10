
import { createClient } from "@supabase/supabase-js";

// Init Supabase
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";
const supabase = createClient(url, key);

async function syncAdminData() {
    console.log("🔄 Syncing Admin Data Between 'profiles' and 'admins'...");

    // 1. Get ALL Admins from Profiles (The Source of Truth for Roles)
    const { data: adminProfiles, error: profileError } = await supabase.from('profiles').select('id, name, email').eq('role', 'admin');

    if (profileError) {
        return console.error("❌ Failed to fetch profiles:", profileError.message);
    }

    console.log(`\nFound ${adminProfiles.length} Users with ROLE='admin'.`);

    // 2. Iterate and check 'admins' table
    let fixedCount = 0;
    for (const admin of adminProfiles) {
        const { data: exists } = await supabase.from('admins').select('id').eq('id', admin.id).maybeSingle();

        if (!exists) {
            console.log(`⚠️  Admin ${admin.email} missing in 'admins' table. Creating entry...`);
            const { error: insertError } = await supabase.from('admins').insert([{
                id: admin.id,
                name: admin.name || admin.email.split('@')[0],
                // add default address if schema requires, or leave null
            }]);

            if (insertError) console.error(`   ❌ Failed to create admin entry: ${insertError.message}`);
            else {
                console.log(`   ✅ Created 'admins' entry for ${admin.email}`);
                fixedCount++;
            }
        } else {
            console.log(`✅  Admin ${admin.email} is synced.`);
        }
    }

    console.log(`\n🎉 Consistency Check Complete. Fixed ${fixedCount} records.`);
}

syncAdminData();
