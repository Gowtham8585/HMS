import { useState } from "react";
import Layout from "../../../components/Layout";
import { createClient } from "@supabase/supabase-js";
import { Shield, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function AdminRegistration() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
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
                        role: 'admin'
                    }
                }
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                await tempClient.from('profiles').insert([{
                    id: data.user.id,
                    name: formData.name,
                    email: formData.email,
                    role: 'admin',
                    address: formData.address
                }]);

                alert(`✔ New Admin Created!\nLogin: ${formData.email}\nPassword: ${formData.password}`);
                navigate('/admin/accounts');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            await tempClient.auth.signOut();
        }
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-400 dark:placeholder-white/20";
    const labelClasses = "block text-xs font-bold uppercase opacity-60 mb-2 tracking-wide text-gray-500 dark:text-gray-400";

    return (
        <Layout title="Admin Registration">
            <div className="max-w-4xl mx-auto py-8">
                <button onClick={() => navigate('/admin/accounts')} className="mb-6 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Back to Accounts
                </button>

                <div className="glass-card p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-white/5">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-white/10">
                        <div className="bg-red-500/10 dark:bg-red-500/20 p-4 rounded-2xl">
                            <Shield className="text-red-600 dark:text-red-400 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register New Admin</h2>
                            <p className="opacity-60 text-gray-500 dark:text-gray-400">Grant full system access to another user</p>
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
                                <input required className={inputClasses} placeholder="Admin Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Email (Login ID)</label>
                                <input required type="email" className={inputClasses} placeholder="admin@clinic.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Password</label>
                                <input required type="password" className={inputClasses} placeholder="Strong Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Address</label>
                                <textarea className={`${inputClasses} h-12 pt-3 resize-none`} placeholder="Home Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                            </div>
                        </div>

                        <button disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">
                            {loading ? "Creating Admin..." : "Register Admin"}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
