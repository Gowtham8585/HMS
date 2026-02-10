
import { useState } from "react";
import Layout from "../../components/Layout";
import { createClient } from "@supabase/supabase-js";
import { User, Activity, FileText, Upload, Save, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase"; // Use the main client for DB inserts

export default function RegisterPatient() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        address: "",
        bloodGroup: "O+",
        medicalHistory: "",
        allergies: "None",
        emergencyContact: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // 1. Generate Auth Credentials
        const tempEmail = `${formData.name.replace(/\s/g, '').toLowerCase()}.${Date.now()}@patient.local`;
        const tempPassword = "patient123";

        try {
            // Create separate client for Auth Signup to avoid logging out current user
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error("Missing Supabase configuration");
            }

            const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { persistSession: false }
            });

            // 2. Sign Up User (Auth)
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: tempEmail,
                password: tempPassword,
                options: {
                    data: {
                        displayName: formData.name,
                        role: 'patient'
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 3. Create Profile (Public)
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    name: formData.name,
                    email: tempEmail,
                    role: 'patient'
                });

                if (profileError) throw profileError;

                // 4. Create Patient Record (Private)
                const { error: patientError } = await supabase.from('patients').upsert({
                    id: authData.user.id,
                    name: formData.name,
                    age: parseInt(formData.age),
                    gender: formData.gender,
                    phone: formData.phone,
                    address: formData.address,
                    blood_group: formData.bloodGroup,
                    medical_history: formData.medicalHistory,
                    allergies: formData.allergies,
                    emergency_contact: formData.emergencyContact
                });

                if (patientError) throw patientError;

                setSuccess(true);
                // Reset Form
                setFormData({
                    name: "", age: "", gender: "Male", phone: "", address: "",
                    bloodGroup: "O+", medicalHistory: "", allergies: "None", emergencyContact: ""
                });
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to register patient");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20";
    const labelClasses = "block text-xs font-bold uppercase opacity-60 mb-2 tracking-wide text-gray-500 dark:text-gray-400";

    return (
        <Layout title="Patient Registration">
            <div className="max-w-5xl mx-auto py-8">

                {success && (
                    <div className="mb-8 p-6 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl flex items-center justify-between text-green-700 dark:text-green-400 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                                <Save size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Patient Registered Successfully!</h3>
                                <p className="opacity-80 text-sm">Patient ID and profile have been created.</p>
                            </div>
                        </div>
                        <button onClick={() => setSuccess(false)} className="px-4 py-2 bg-white dark:bg-black/20 rounded-lg font-bold text-sm hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors">
                            Close
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-card p-8 rounded-[2.5rem] shadow-xl bg-white dark:bg-slate-800 border border-white/20">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Basic Information</h2>
                                    <p className="opacity-60 text-gray-500 dark:text-gray-400">Personal details for identification</p>
                                </div>
                            </div>

                            <form id="patientForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className={labelClasses}>Full Name</label>
                                    <input required className={inputClasses} placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Age</label>
                                    <input required type="number" className={inputClasses} placeholder="25" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Gender</label>
                                    <select className={inputClasses} style={{ colorScheme: 'light dark' }} value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Phone Number</label>
                                    <input required type="tel" className={inputClasses} placeholder="+91..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Emergency Contact</label>
                                    <input className={inputClasses} placeholder="Relative Phone" value={formData.emergencyContact} onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClasses}>Address</label>
                                    <textarea className={`${inputClasses} h-24 resize-none`} placeholder="Residential Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                                </div>
                            </form>
                        </div>

                        <div className="glass-card p-8 rounded-[2.5rem] shadow-xl bg-white dark:bg-slate-800 border border-white/20">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400">
                                    <Activity size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Medical Profile</h2>
                                    <p className="opacity-60 text-gray-500 dark:text-gray-400">Critical health information</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>Blood Group</label>
                                    <select className={inputClasses} style={{ colorScheme: 'light dark' }} value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}>
                                        <option>A+</option><option>A-</option>
                                        <option>B+</option><option>B-</option>
                                        <option>O+</option><option>O-</option>
                                        <option>AB+</option><option>AB-</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Known Allergies</label>
                                    <input className={inputClasses} placeholder="e.g. Penicillin, Peanuts" value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClasses}>Medical History</label>
                                    <textarea className={`${inputClasses} h-32 resize-none`} placeholder="Previous surgeries, chronic conditions, etc." value={formData.medicalHistory} onChange={e => setFormData({ ...formData, medicalHistory: e.target.value })}></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="sticky top-8">
                            <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-800 border border-white/20 shadow-lg mb-6">
                                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Summary</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Status</span>
                                        <span className="font-bold text-green-500">New Registration</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-60">Date</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => document.getElementById('patientForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">Registering...</span>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Register Patient
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="p-6 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/10 text-center text-gray-400 dark:text-gray-500 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer group bg-gray-50 dark:bg-white/5">
                                <Upload size={32} className="mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                <p className="font-bold text-sm">Upload Documents</p>
                                <p className="text-xs opacity-60">ID Proof, Insurance, Reports</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
}
