import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function BookAppointment() {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        status: 'scheduled'
    });

    useEffect(() => {
        const load = async () => {
            // Fetch patients from 'profiles' to show email (Login ID) for differentiation
            const { data: p } = await supabase.from('profiles').select('id, name, email').eq('role', 'patient');
            // Fetch doctors from 'profiles' to ensure we get the correct Auth UUID
            const { data: d } = await supabase.from('profiles').select('id, name, specialization').eq('role', 'doctor');

            if (p && p.length > 0) {
                setPatients(p);
                setFormData(prev => ({ ...prev, patient_id: p[0].id }));
            }
            if (d && d.length > 0) {
                setDoctors(d);
                setFormData(prev => ({ ...prev, doctor_id: d[0].id })); // Select first doctor by default
            }
        }
        load();
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('appointments').insert([formData]);

        if (!error) {
            alert("✔ Appointment Booked!");
            navigate("/receptionist");
        } else {
            alert("Error: " + error.message);
        }
        setLoading(false);
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all text-gray-900 dark:text-white";
    const labelClasses = "block font-bold text-gray-700 dark:text-gray-300 mb-2 text-lg";

    return (
        <Layout title="Book Appointment">
            <div className="max-w-xl mx-auto">
                <form onSubmit={handleSubmit} className="glass-card bg-white dark:bg-white/5 p-6 sm:p-8 rounded-xl shadow-md space-y-6 border border-gray-200 dark:border-white/10">
                    <div>
                        <label className={labelClasses}>Select Patient</label>
                        {patients.length > 0 ? (
                            <select
                                className={inputClasses}
                                style={{ colorScheme: 'light dark' }}
                                onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                            >
                                {patients.map(p => <option key={p.id} value={p.id}>{p.name} {p.email ? `(${p.email})` : ''}</option>)}
                            </select>
                        ) : (
                            <p className="text-red-500">No patients found. Please register a patient first.</p>
                        )}
                    </div>
                    <div>
                        <label className={labelClasses}>Select Doctor</label>
                        {doctors.length > 0 ? (
                            <select
                                className={inputClasses}
                                style={{ colorScheme: 'light dark' }}
                                onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}
                            >
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                            </select>
                        ) : <p className="text-red-500">No doctors available.</p>}

                    </div>
                    <div>
                        <label className={labelClasses}>Appointment Date</label>
                        <input
                            type="date"
                            required
                            className={inputClasses}
                            value={formData.appointment_date}
                            onChange={e => setFormData({ ...formData, appointment_date: e.target.value })}
                        />
                    </div>
                    <button
                        disabled={loading || patients.length === 0}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg text-xl mt-4 hover:bg-blue-700 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Booking..." : "BOOK NOW"}
                    </button>
                </form>
            </div>
        </Layout>
    )
}
