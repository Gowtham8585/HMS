import { useState } from "react";
import Layout from "../../../components/Layout";
import { createClient } from "@supabase/supabase-js";
import { Stethoscope, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

const getClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = localStorage.getItem('supabase_key') || import.meta.env.VITE_SUPABASE_KEY;
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
};

export default function DoctorRegistration() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        specialization: "General Physician",
        fees: 500,
        experience: 0,
        qualification: "",
        address: "",
        availability: "Full Time (Mon-Sat, 9AM-5PM)"
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Use direct client with env vars, ignoring localStorage
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false }
        });

        try {
            const { data, error: signUpError } = await tempClient.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        displayName: formData.name,
                        role: 'doctor',
                        specialization: formData.specialization
                    }
                }
            });

            if (signUpError) {
                if (signUpError.message.includes("already registered")) {
                    setError("User already exists.");
                } else {
                    throw signUpError;
                }
                return;
            }

            if (data.user) {
                // 1. Manually insert/ensure Profile entry first
                // New Schema: id (auto), user_id (data.user.id), full_name, role, email
                const { error: profileError } = await supabase.from('profiles').upsert({
                    user_id: data.user.id,
                    email: formData.email,
                    full_name: formData.name,
                    role: 'doctor'
                }, { onConflict: 'user_id' }); // Conflict on user_id now

                if (profileError) {
                    console.error("Profile creation failed:", profileError);
                }

                // 2. Insert into Doctors table
                // New Schema: id (auto), user_id, full_name, specialization, etc.
                const { error: docError } = await supabase.from('doctors').insert({
                    // id is auto-generated
                    user_id: data.user.id,
                    full_name: formData.name,
                    email: formData.email,
                    specialization: formData.specialization,
                    qualification: formData.qualification,
                    experience_years: textToNumber(formData.experience),
                    consultation_fee: textToNumber(formData.fees),
                    // phone: formData.phone, // Add if you have it
                    // available_days: ... 
                    // available_from: ...
                    is_active: true
                });

                if (docError) throw docError;

                alert(`✔ Doctor Created Successfully!\nLogin: ${formData.email}`);
                navigate('/admin/accounts');
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const textToNumber = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 dark:placeholder-white/20";
    const labelClasses = "block text-xs font-bold uppercase opacity-60 mb-2 tracking-wide text-gray-500 dark:text-gray-400";

    return (
        <Layout title="Doctor Registration">
            <div className="max-w-4xl mx-auto py-8">
                <button onClick={() => navigate('/admin/accounts')} className="mb-6 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Back to Accounts
                </button>

                <div className="glass-card p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-white/5">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-white/10">
                        <div className="bg-blue-500/10 dark:bg-blue-500/20 p-4 rounded-2xl">
                            <Stethoscope className="text-blue-600 dark:text-blue-400 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register New Doctor</h2>
                            <p className="opacity-60 text-gray-500 dark:text-gray-400">Create a profile for a medical professional</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClasses}>Full Name</label>
                                <input required className={inputClasses} placeholder="Dr. Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Email (Login ID)</label>
                                <input required type="email" className={inputClasses} placeholder="doctor@clinic.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Password</label>
                                <input required type="password" className={inputClasses} placeholder="Secret Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Specialization</label>
                                <select className={inputClasses} style={{ colorScheme: 'light dark' }} value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })}>
                                    <option>General Physician</option>
                                    <option>Cardiologist</option>
                                    <option>Dermatologist</option>
                                    <option>Pediatrician</option>
                                    <option>Gynecologist</option>
                                    <option>Orthopedic</option>
                                    <option>Dentist</option>
                                    <option>Surgeon</option>
                                    <option>ENT Specialist</option>
                                    <option>Neurologist</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Availability</label>
                                <select
                                    className={inputClasses}
                                    style={{ colorScheme: 'light dark' }}
                                    value={formData.availability}
                                    onChange={e => setFormData({ ...formData, availability: e.target.value })}
                                >
                                    <option>Full Time (Mon-Sat, 9AM-5PM)</option>
                                    <option>Morning Shift (9AM-1PM)</option>
                                    <option>Evening Shift (4PM-8PM)</option>
                                    <option>Night Shift (8PM-12AM)</option>
                                    <option>Weekends Only</option>
                                    <option>On Call</option>
                                    <option>Emergency Only</option>
                                    <option>Tuesday & Thursday</option>
                                    <option>Mon-Wed-Fri</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Consultation Fee (₹)</label>
                                <input required type="number" className={inputClasses} value={formData.fees} onChange={e => setFormData({ ...formData, fees: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Experience (Years)</label>
                                <input type="number" className={inputClasses} value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Qualification</label>
                                <input className={inputClasses} placeholder="e.g. MBBS, MD" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Residential Address</label>
                                <textarea className={`${inputClasses} h-24 resize-none`} placeholder="Full Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                            </div>
                        </div>

                        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">
                            {loading ? "Creating Profile..." : "Register Doctor"}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
