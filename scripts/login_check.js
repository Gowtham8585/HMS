
import { createClient } from "@supabase/supabase-js";

// Init Supabase
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";
const supabase = createClient(url, key);

async function loginCheck() {
    console.log("🔍 Running Detailed Login Diagnostic...");

    const testEmail = "admin@gmail.com";
    const testPassword = "password123";

    // 1. Attempt Sign In
    const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });

    if (loginError) {
        console.error(`❌ Authentication FAILED for ${testEmail}:`, loginError.message);
        console.log("⚠️  Please verify credentials or network.");
        return;
    }

    console.log(`✅ Auth Success! User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Aud: ${user.aud}`);
    console.log(`   Confirmed At: ${user.confirmed_at || 'Not Confirmed'}`);

    // 2. Fetch Profile EXACTLY like Frontend (using maybeSingle())
    console.log("\n2. Fetching Profile...");
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (profileError) {
        console.error(`❌ Profile Fetch ERROR: ${profileError.message}`);
        console.log("   (If RLS blocks this, you might not see the error clearly)");
    } else if (!profile) {
        console.error("❌ Profile NOT FOUND (Result is null/undefined)");
        console.log("   This explains 'User Role Not Found: null'");

        // AUTO-FIX: Create Profile
        console.log("   Attempting to CREATE profile...");
        const { error: fixError } = await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            role: 'admin',
            name: 'System Admin (Autofix)'
        });

        if (fixError) console.error("   ❌ Auto-Fix Failed:", fixError.message);
        else console.log("   ✅ Profile Created/Updated successfully!");

    } else {
        console.log("✅ Profile FOUND:", profile);
        console.log(`   Role: '${profile.role}'`);

        if (!profile.role) {
            console.error("⚠️  Profile exists but ROLE is null/empty!");
            // AUTO-FIX Role
            await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
            console.log("   ✅ Fixed Role -> 'admin'");
        }
    }
}

loginCheck();
