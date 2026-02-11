const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_KEY);

(async () => {
    try {
        console.log('=== DEBUGGING DOCTOR APPOINTMENTS ===\n');

        // 1. Check all profiles with role='doctor'
        const { data: doctors, error: docError } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, role')
            .eq('role', 'doctor');

        if (docError) {
            console.error('Error fetching doctors:', docError);
        } else {
            console.log('Doctors in profiles table:');
            console.log(JSON.stringify(doctors, null, 2));
        }

        // 2. Check all appointments
        const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('id, doctor_id, patient_id, appointment_date, appointment_time, status');

        if (apptError) {
            console.error('Error fetching appointments:', apptError);
        } else {
            console.log('\nAll appointments:');
            console.log(JSON.stringify(appointments, null, 2));
        }

        // 3. Check if doctor_id in appointments matches any profile id
        if (doctors && appointments) {
            const doctorIds = doctors.map(d => d.id);
            const matchingAppointments = appointments.filter(a => doctorIds.includes(a.doctor_id));
            console.log('\nAppointments matching doctor profiles:');
            console.log(JSON.stringify(matchingAppointments, null, 2));
        }

        // 4. Check foreign key constraint
        const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
            query: `
                SELECT 
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.table_name = 'appointments' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND kcu.column_name = 'doctor_id';
            `
        });

        if (!constraintError && constraints) {
            console.log('\nForeign key constraint on appointments.doctor_id:');
            console.log(JSON.stringify(constraints, null, 2));
        }

    } catch (error) {
        console.error('Script error:', error);
    }
})();
