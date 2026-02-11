import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Trash2, Calendar, Clock, User, UserCheck } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export default function BookAppointment() {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [todaysList, setTodaysList] = useState([]);
    const navigate = useNavigate();

    const [patientType, setPatientType] = useState('existing'); // 'existing' | 'new_permanent' | 'new_temporary'
    const [tempPatient, setTempPatient] = useState({
        full_name: '',
        phone: '',
        age: '',
        gender: 'Male',
        email: '',
        password: ''
    });

    const [formData, setFormData] = useState({
        patient_id: '',
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:00',
        status: 'scheduled'
    });

    useEffect(() => {
        const load = async () => {
            // Fetch ONLY PERMANENT patients (with user_id)
            const { data: p } = await supabase.from('patients').select('id, full_name, email').not('user_id', 'is', null).order('full_name');
            // Fetch doctors from PROFILES table
            const { data: d } = await supabase
                .from('profiles')
                .select('id, specialization, full_name')
                .eq('role', 'doctor')
                .order('full_name');

            if (p) {
                setPatients(p);
                if (p.length > 0) setFormData(prev => ({ ...prev, patient_id: p[0].id }));
            }
            if (d) {
                setDoctors(d);
                if (d.length > 0) setFormData(prev => ({ ...prev, doctor_id: d[0].id }));
            }
        }
        load();
    }, [])

    useEffect(() => {
        loadTodaysAppointments();
    }, [formData.appointment_date]);

    const loadTodaysAppointments = async () => {
        const { data } = await supabase
            .from('appointments')
            .select(`
                *,
                patients (full_name, phone),
                doctors (full_name, specialization)
            `)
            .eq('appointment_date', formData.appointment_date)
            .order('appointment_time', { ascending: true });

        if (data) setTodaysList(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let finalPatientId = formData.patient_id;

        try {
            // CASE 1: New Permanent Patient (Auth User + Profile + Patient)
            if (patientType === 'new_permanent') {
                // 1. Setup isolated Supabase client
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;
                const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
                    auth: { persistSession: false }
                });

                // 2. Sign Up User
                const { data: authData, error: authError } = await tempClient.auth.signUp({
                    email: tempPatient.email,
                    password: tempPatient.password,
                    options: {
                        data: {
                            displayName: tempPatient.full_name,
                            role: 'patient'
                        }
                    }
                });

                if (authError) throw authError;

                if (authData.user) {
                    finalPatientId = authData.user.id;

                    // 3. Create Profile
                    const { error: profileError } = await supabase.from('profiles').upsert({
                        user_id: finalPatientId,
                        full_name: tempPatient.full_name,
                        email: tempPatient.email,
                        role: 'patient'
                    });
                    if (profileError) throw profileError;

                    // 4. Create Patient Record
                    const { error: patientError } = await supabase.from('patients').upsert({
                        user_id: finalPatientId,
                        full_name: tempPatient.full_name,
                        phone: tempPatient.phone,
                        date_of_birth: `${new Date().getFullYear() - parseInt(tempPatient.age || 25)}-01-01`,
                        gender: tempPatient.gender.toLowerCase(),
                        email: tempPatient.email,
                        patient_type: 'permanent'
                    });
                    if (patientError) throw patientError;
                }
            }
            // CASE 2: New Temporary Patient (No Auth, No Profile, just Patient record with NULL user_id)
            else if (patientType === 'new_temporary') {
                const { data: newPatient, error: createError } = await supabase
                    .from('patients')
                    .insert([{
                        user_id: null, // Explicitly NULL
                        full_name: tempPatient.full_name,
                        phone: tempPatient.phone,
                        date_of_birth: `${new Date().getFullYear() - parseInt(tempPatient.age || 25)}-01-01`,
                        gender: tempPatient.gender.toLowerCase(),
                        patient_type: 'temporary'
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                finalPatientId = newPatient.id;
            }

            // BOOK APPOINTMENT
            const { error } = await supabase.from('appointments').insert([{
                ...formData,
                patient_id: finalPatientId
            }]);

            if (error) throw error;

            alert("✔ Appointment Booked!");
            loadTodaysAppointments();

            // Reset temp form if needed
            if (patientType !== 'existing') {
                setTempPatient({ full_name: '', phone: '', age: '', gender: 'Male', email: '', password: '' });
                // Reset to existing view to avoid confusion? or keep as is.
            }

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Cancel this appointment?")) return;
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (!error) loadTodaysAppointments();
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all text-gray-900 dark:text-white";
    const labelClasses = "block font-bold text-gray-700 dark:text-gray-300 mb-2 text-lg";

    return (
        <Layout title="Book Appointment">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Booking Form */}
                <div>
                    <div className="bg-white dark:bg-white/5 p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-white/10 sticky top-6">
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                            <Calendar className="text-blue-600" /> New Booking
                        </h2>

                        {/* Patient Type Toggle */}
                        <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-white/10 p-2 rounded-xl mb-6">
                            <button
                                type="button"
                                onClick={() => setPatientType('existing')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${patientType === 'existing' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                Existing
                            </button>
                            <button
                                type="button"
                                onClick={() => setPatientType('new_permanent')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${patientType === 'new_permanent' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                New (Perm)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPatientType('new_temporary')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${patientType === 'new_temporary' ? 'bg-white dark:bg-gray-800 shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            >
                                New (Temp)
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Conditional Patient Input */}
                            {patientType === 'existing' ? (
                                <div>
                                    <label className={labelClasses}>Select Patient</label>
                                    {patients.length > 0 ? (
                                        <select
                                            className={inputClasses}
                                            style={{ colorScheme: 'light dark' }}
                                            onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                                            value={formData.patient_id}
                                        >
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name || p.name} {p.email ? `(${p.email})` : ''}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-red-500">No patients found. Please register a patient first.</p>
                                    )}
                                </div>
                            ) : (
                                <div className={`space-y-4 animate-in fade-in slide-in-from-top-2 border-l-4 pl-4 py-2 rounded-r-xl ${patientType === 'new_permanent' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5' : 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/5'}`}>
                                    <h3 className={`font-bold text-sm uppercase tracking-widest mb-2 ${patientType === 'new_permanent' ? 'text-blue-600' : 'text-amber-600'}`}>
                                        {patientType === 'new_permanent' ? 'New Permanent Patient (With Login)' : 'New Temporary Patient (Quick)'}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className={labelClasses}>Full Name</label>
                                            <input required className={inputClasses} placeholder="John Doe" value={tempPatient.full_name} onChange={e => setTempPatient({ ...tempPatient, full_name: e.target.value })} />
                                        </div>

                                        {patientType === 'new_permanent' && (
                                            <>
                                                <div>
                                                    <label className={labelClasses}>Email (for Login)</label>
                                                    <input required type="email" className={inputClasses} placeholder="patient@example.com" value={tempPatient.email} onChange={e => setTempPatient({ ...tempPatient, email: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Password</label>
                                                    <input required type="password" className={inputClasses} placeholder="******" value={tempPatient.password} onChange={e => setTempPatient({ ...tempPatient, password: e.target.value })} />
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className={labelClasses}>Age</label>
                                            <input required type="number" className={inputClasses} placeholder="25" value={tempPatient.age} onChange={e => setTempPatient({ ...tempPatient, age: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Phone</label>
                                            <input required type="tel" className={inputClasses} placeholder="+91..." value={tempPatient.phone} onChange={e => setTempPatient({ ...tempPatient, phone: e.target.value })} />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className={labelClasses}>Gender</label>
                                            <select className={inputClasses} value={tempPatient.gender} onChange={e => setTempPatient({ ...tempPatient, gender: e.target.value })}>
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={labelClasses}>Select Doctor</label>
                                {doctors.length > 0 ? (
                                    <select
                                        className={inputClasses}
                                        style={{ colorScheme: 'light dark' }}
                                        onChange={e => setFormData({ ...formData, doctor_id: e.target.value })}
                                        value={formData.doctor_id}
                                    >
                                        {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name || d.name} ({d.specialization})</option>)}
                                    </select>
                                ) : <p className="text-red-500">No doctors available.</p>}

                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className={labelClasses}>Date</label>
                                    <input
                                        type="date"
                                        required
                                        className={inputClasses}
                                        value={formData.appointment_date}
                                        onChange={e => setFormData({ ...formData, appointment_date: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={labelClasses}>Time</label>
                                    <input
                                        type="time"
                                        required
                                        className={inputClasses}
                                        value={formData.appointment_time}
                                        onChange={e => setFormData({ ...formData, appointment_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                disabled={loading || (patientType === 'permanent' && patients.length === 0)}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-xl mt-4 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                            >
                                {loading ? "Booking..." : "CONFIRM BOOKING"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Queue List */}
                <div>
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-gray-900 dark:text-white px-2">
                        <UserCheck className="text-emerald-600" /> Today's Queue
                    </h2>

                    {todaysList.length === 0 ? (
                        <div className="text-center p-12 bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10">
                            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-bold opacity-60">No appointments for this date.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todaysList.map((app, index) => (
                                <div key={app.id} className="bg-white dark:bg-white/5 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex justify-between items-center group hover:scale-[1.02] transition-transform">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-xl">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{app.patients?.full_name}</h4>
                                            <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {app.appointment_time?.slice(0, 5)}</span>
                                                <span className="flex items-center gap-1 text-blue-500"><User size={12} /> {app.doctors?.full_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(app.id)}
                                        className="p-3 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 hover:text-red-700"
                                        title="Cancel Appointment"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
