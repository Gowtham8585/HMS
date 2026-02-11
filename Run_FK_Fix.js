const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_KEY);

const sql = `
DO $$ 
BEGIN 
    -- Clean up orphaned appointments
    DELETE FROM public.appointments WHERE doctor_id IS NOT NULL AND doctor_id NOT IN (SELECT id FROM public.profiles);
    
    -- Drop old FK
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
    
    -- Add new FK to profiles
    ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_doctor_id_fkey 
        FOREIGN KEY (doctor_id) 
        REFERENCES public.profiles(id);
END $$;
`;

(async () => {
    console.log('Running SQL...');
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
        console.error('ExecSQL Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success: appointments_doctor_id_fkey updated.');
    }
})();
