
import { createClient } from '@supabase/supabase-js';

const url = "https://wbfpzixwytsrsnoswllm.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZnB6aXh3eXRzcnNub3N3bGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQxMDcsImV4cCI6MjA4NjI5MDEwN30.5HOw3aAuWOj14-9-wZ9lI9yUj7VedM3Z8oA1J1h2N_E";

const supabase = createClient(url, key);

async function inspectTable() {
    console.log("Inspecting profiles table structure...");

    // Attempt to insert a dummy row to get a clear error about structure or just list rows
    // We can't query information_schema easily with js client on public schema with anon key usually,
    // but we can try to Select * and look at the returned keys.

    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.log("Error selecting:", error.message);
    } else {
        if (data && data.length > 0) {
            console.log("Columns found based on existing row:", Object.keys(data[0]));
        } else {
            console.log("No rows found. Can't infer columns from data.");
        }
    }
}

inspectTable();
