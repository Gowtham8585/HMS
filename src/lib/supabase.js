
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Fallback to localStorage for easier setup
// const localKey = localStorage.getItem('supabase_key');
// if (localKey && !supabaseKey) { 
//   supabaseKey = localKey;
// }

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
    console.warn("VITE_SUPABASE_KEY is missing. App will require manual setup.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true, // Keep user logged in across refreshes
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

export const isKeyValid = () => {
    return supabaseKey && supabaseKey !== 'your_supabase_anon_key_here' && supabaseKey !== 'placeholder';
};
