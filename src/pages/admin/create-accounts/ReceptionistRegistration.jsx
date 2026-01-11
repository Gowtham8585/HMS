import { useState } from "react";
import Layout from "../../../components/Layout";
import { createClient } from "@supabase/supabase-js";
import { Briefcase, AlertCircle, ArrowLeft } from "lucide-react";
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

export default function ReceptionistRegistration() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const tempClient = getClient();

        try {
            const { data, error: signUpError } = await tempClient.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        displayName: formData.name,
                        role: 'receptionist',
                        phone: formData.phone
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // Use global supabase (Admin) client for insert to bypass RLS issues for new user
                const { error: profileError } = await supabase.from('profiles').insert([{
                    id: data.user.id,
                    name: formData.name,
                    email: formData.email,
                    role: 'receptionist',
                    address: formData.address
                }]);

                if (profileError) {
                    alert("Error creating profile: " + profileError.message);
                    return;
                }

                alert(`✔ Receptionist Created Successfully!\nLogin: ${formData.email}\nPassword: ${formData.password}`);
                navigate('/admin/accounts');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            await tempClient.auth.signOut();
        }
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-400 dark:placeholder-white/20";
    const labelClasses = "block text-xs font-bold uppercase opacity-60 mb-2 tracking-wide text-gray-500 dark:text-gray-400";

    return (
        <Layout title="Receptionist Registration">
            <div className="max-w-4xl mx-auto py-8">
                <button onClick={() => navigate('/admin/accounts')} className="mb-6 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Back to Accounts
                </button>

                <div className="glass-card p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-white/5">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-white/10">
                        <div className="bg-purple-500/10 dark:bg-purple-500/20 p-4 rounded-2xl">
                            <Briefcase className="text-purple-600 dark:text-purple-400 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register Receptionist</h2>
                            <p className="opacity-60 text-gray-500 dark:text-gray-400">Staff for front desk and patient management</p>
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
                                <input required className={inputClasses} placeholder="Staff Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Email (Login ID)</label>
                                <input required type="email" className={inputClasses} placeholder="staff@clinic.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Password</label>
                                <input required type="password" className={inputClasses} placeholder="Secret Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Phone Number</label>
                                <input className={inputClasses} placeholder="Optional" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Full Address</label>
                                <textarea className={`${inputClasses} h-24 resize-none`} placeholder="Residential Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                            </div>
                        </div>

                        <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">
                            {loading ? "Creating Profile..." : "Register Receptionist"}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
