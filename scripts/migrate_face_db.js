import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'YOUR_SUPABASE_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addFaceDescriptorColumn() {
    const { error } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'workers',
        column_name: 'face_descriptor',
        column_type: 'jsonb'
    });

    if (error) {
        // If RPC approach is not set up, we might need a manual SQL run or console instruction.
        // For now, let's assume we can try a direct SQL query via a special tool if available,
        // or just return the SQL for the user.
        console.error("Could not auto-migrate via RPC. Please run this SQL in your Supabase SQL Editor:");
        console.log("ALTER TABLE workers ADD COLUMN IF NOT EXISTS face_descriptor jsonb;");
    } else {
        console.log("Migration successful or column already exists.");
    }
}

addFaceDescriptorColumn();
