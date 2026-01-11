import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vrkcgfzkxkkynvdjmpge.supabase.co'
let supabaseKey = import.meta.env.VITE_SUPABASE_KEY

// Fallback to localStorage for easier setup
const localKey = localStorage.getItem('supabase_key');
if (localKey) {
    supabaseKey = localKey;
}

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
    console.warn("VITE_SUPABASE_KEY is missing. App will require manual setup.");
}

export const supabase = createClient(supabaseUrl, supabaseKey || 'placeholder')

export const isKeyValid = () => {
    return supabaseKey && supabaseKey !== 'your_supabase_anon_key_here' && supabaseKey !== 'placeholder';
}
