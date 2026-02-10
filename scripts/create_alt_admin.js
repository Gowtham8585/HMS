
import { createClient } from '@supabase/supabase-js';
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";

const supabase = createClient(url, key);

async function createAltAdmin() {
    const email = 'hospital_admin@gmail.com';
    const password = '1234567890';

    console.log(`Step 1: Signing up user ${email}...`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (signUpError) {
        if (signUpError.message.includes("already registered")) {
            console.log("ℹ️ User exists. Logging in...");
            const { data: loginData } = await supabase.auth.signInWithPassword({
                email, password
            });
            // Proceed assuming login worked, or fail
            console.log("✅ Logged in existing user:", loginData?.user?.id);
            await ensureProfile(loginData?.user?.id, email);
        } else {
            console.error("❌ Sign Up Error:", signUpError.message);
        }
    } else {
        console.log("✅ New User Created!");
        await ensureProfile(signUpData?.user?.id, email);
    }
}

async function ensureProfile(userId, email) {
    if (!userId) return;

    console.log(`Step 2: Ensuring Profile for ID ${userId}...`);
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (!existing) {
        console.log("   Creating Profile...");
        const { error } = await supabase.from('profiles').insert([{
            id: userId,
            email: email, // This column must exist in schema
            name: 'Hospital Admin',
            role: 'admin'
        }]);
        if (error) console.error("   ❌ Profile Error:", error.message);
        else console.log("   ✅ Profile Created!");
    } else {
        console.log("   ✅ Profile already exists.");
    }

    console.log("\n==================================");
    console.log("LOGIN CREDENTIALS:");
    console.log(`Email:    ${email}`);
    console.log(`Password: 1234567890`);
    console.log("==================================");
}

createAltAdmin();
