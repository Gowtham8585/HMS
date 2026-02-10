
import { createClient } from '@supabase/supabase-js';
const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";

const supabase = createClient(url, key);

async function repairProfile() {
    console.log("Attempting to login to get User ID...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@hospital.com',
        password: 'password123'
    });

    if (error) {
        console.error("❌ Login failed:", error.message);
        return;
    }

    const userId = data.user.id;
    console.log("✅ Logged in successfully. ID:", userId);

    // Check if profile exists
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (!profile) {
        console.log("⚠️ Profile missing. Inserting now...");
        const { error: insertError } = await supabase.from('profiles').insert([{
            id: userId,
            name: 'System Admin',
            email: 'admin@hospital.com',
            role: 'admin'
        }]);

        if (insertError) {
            console.error("❌ Profile Insert Failed:", insertError.message);
        } else {
            console.log("✅ Profile restored successfully!");
        }
    } else {
        console.log("✅ Profile already exists:", profile);
    }
}

repairProfile();
