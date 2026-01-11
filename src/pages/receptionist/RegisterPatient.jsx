import { useState } from "react";
import Layout from "../../components/Layout";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { Mail, Key, AlertCircle } from "lucide-react";

// Create isolated client for patient account creation
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

export default function RegisterPatient() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        age: '',
        gender: 'Male',
        phone: '',
        blood_group: '',
        weight: '',
        height: '',
        address: '',
        emergency_contact_phone: '',
        medical_history: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const tempClient = getClient();

            // 1. Create auth account
            const { data, error: signUpError } = await tempClient.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        displayName: formData.name,
                        role: 'patient'
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // 2. Create profile
                const { error: profileError } = await tempClient.from('profiles').insert([{
                    id: data.user.id,
                    name: formData.name,
                    email: formData.email,
                    role: 'patient'
                }]);

                if (profileError) {
                    console.error("Profile error:", profileError);
                    setError("Account created but profile failed. Contact admin.");
                    return;
                }

                // 3. Create patient record
                const { error: patientError } = await tempClient.from('patients').insert([{
                    id: data.user.id,
                    name: formData.name,
                    age: formData.age,
                    gender: formData.gender,
                    phone: formData.phone,
                    blood_group: formData.blood_group,
                    weight: formData.weight,
                    height: formData.height,
                    address: formData.address,
                    emergency_contact_phone: formData.emergency_contact_phone,
                    medical_history: formData.medical_history
                }]);

                if (patientError) throw patientError;

                await tempClient.auth.signOut();
                alert(`✔ Patient Registered!\n\nLogin Credentials:\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nPlease provide these to the patient.`);
                navigate("/receptionist");
            }
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-xl text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20";
    const labelClasses = "block font-bold text-gray-700 dark:text-gray-300 mb-2 text-lg";

    return (
        <Layout title="Register New Patient">
            <div className="max-w-3xl mx-auto py-8">
                <form onSubmit={handleSubmit} className="glass-card bg-white dark:bg-white/5 p-8 rounded-3xl shadow-2xl space-y-8 transition-all border border-gray-200 dark:border-white/10">

                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-300 text-sm">
                        <p className="font-bold mb-1">📧 Login Credentials</p>
                        <p>Create email and password for the patient to access their dashboard.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Login Credentials */}
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Patient Email (Login ID)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/20" size={20} />
                                <input
                                    type="email"
                                    required
                                    className={`${inputClasses} pl-12`}
                                    placeholder="patient@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClasses}>Login Password</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/20" size={20} />
                                <input
                                    type="text"
                                    required
                                    className={`${inputClasses} pl-12`}
                                    placeholder="Min. 6 characters (patient will use this to log in)"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="md:col-span-2">
                            <label className={labelClasses}>Full Name</label>
                            <input
                                required
                                className={inputClasses}
                                placeholder="e.g. Ram Kumar"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Age</label>
                            <input
                                type="number"
                                required
                                className={inputClasses}
                                placeholder="e.g. 45"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Gender</label>
                            <select
                                className={inputClasses}
                                style={{ colorScheme: 'light dark' }}
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>Blood Group</label>
                            <select
                                className={inputClasses}
                                style={{ colorScheme: 'light dark' }}
                                value={formData.blood_group}
                                onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                            >
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>Phone Number</label>
                            <input
                                type="tel"
                                required
                                className={inputClasses}
                                placeholder="e.g. 9876543210"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Weight (kg)</label>
                            <input
                                type="text"
                                className={inputClasses}
                                placeholder="e.g. 70"
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Height (cm)</label>
                            <input
                                type="text"
                                className={inputClasses}
                                placeholder="e.g. 175"
                                value={formData.height}
                                onChange={e => setFormData({ ...formData, height: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClasses}>Emergency Contact Phone</label>
                            <input
                                type="tel"
                                className={inputClasses}
                                placeholder="e.g. 9123456789"
                                value={formData.emergency_contact_phone}
                                onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClasses}>Address</label>
                            <textarea
                                className={`${inputClasses} h-24 resize-none`}
                                placeholder="Enter full address"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClasses}>Medical History / Important Notes</label>
                            <textarea
                                className={`${inputClasses} h-32 resize-none`}
                                placeholder="Any allergies, previous surgeries, or conditions..."
                                value={formData.medical_history}
                                onChange={e => setFormData({ ...formData, medical_history: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-5 rounded-2xl text-xl mt-4 hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all shadow-xl shadow-purple-500/20"
                    >
                        {loading ? "Registering..." : "REGISTER PATIENT"}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
