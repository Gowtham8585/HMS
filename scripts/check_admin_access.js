
import { createClient } from "@supabase/supabase-js";

// Use Supabase URL and Key directly
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";

const supabase = createClient(url, key);

async function checkAdmin() {
    console.log("Checking Admin Status...");
    const email = "admin@gmail.com";

    // 1. Get Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        // Fallback if listUsers not allowed (anon key)
        console.log("Can't list users. Trying to login...");
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password: "1234567890" // Standard password
        });

        if (loginError) {
            console.error("Login Failed:", loginError.message);
            return;
        }

        const user = loginData.user;
        console.log(`Auth User Exists: ${user.id}`);
        await checkProfile(user.id);
    } else {
        const user = users.find(u => u.email === email);
        if (!user) {
            console.error("Auth User NOT Found!");
            return;
        }
        console.log(`Auth User Exists: ${user.id}`);
        await checkProfile(user.id);
    }
}

async function checkProfile(userId) {
    // 2. Check Profile Table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error("Profile Error:", profileError.message);
        console.log("ATTEMPTING TO FIX PROFILE...");
        await fixProfile(userId);
    } else {
        console.log("Profile Found:", profile);
        if (profile.role !== 'admin') {
            console.error(`Wrong Role: ${profile.role}. Fixing...`);
            await updateRole(userId);
        } else {
            console.log("✅ Admin Access should work!");
        }
    }
}

async function fixProfile(userId) {
    const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email: "hospital_admin@gmail.com",
        role: "admin",
        name: "Hospital Admin"
    });

    if (error) console.error("Fix Failed:", error.message);
    else console.log("✅ Profile Fixed. Try logging in now.");
}

async function updateRole(userId) {
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    if (error) console.error("Role Update Failed:", error.message);
    else console.log("✅ Role Updated to Admin.");
}

checkAdmin();
