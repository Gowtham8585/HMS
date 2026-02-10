import { useState } from "react";
import Layout from "../../../components/Layout";
import { createClient } from "@supabase/supabase-js";
import { User, AlertCircle, ArrowLeft, Camera, CheckCircle } from "lucide-react";
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

export default function WorkerRegistration() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [createdWorker, setCreatedWorker] = useState(null); // { id, name }

    const [formData, setFormData] = useState({
        name: "",
        role: "Cleaner",
        salary: "",
        phone: "",
        address: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false }
        });

        try {
            // Ensure data is valid
            if (!formData.name) {
                setError("Please fill in all required fields.");
                setLoading(false);
                return;
            }

            // Generate a default password if not provided 
            const passwordToUse = "worker123";

            // AUTO-GENERATE EMAIL
            const timestamp = Date.now().toString().slice(-4);
            const cleanName = (formData.name || 'worker').replace(/\s+/g, '').toLowerCase();
            const generatedEmail = `${cleanName}.${timestamp}@worker.local`;

            const { data, error: signUpError } = await tempClient.auth.signUp({
                email: generatedEmail,
                password: passwordToUse,
                options: {
                    data: {
                        displayName: formData.name,
                        role: 'worker',
                        phone: formData.phone
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
                const { error: workerError } = await supabase.from('workers').upsert({
                    id: data.user.id,
                    name: formData.name,
                    role: formData.role,
                    email: generatedEmail,
                    phone: formData.phone,
                    address: formData.address,
                    per_day_salary: formData.salary
                });

                if (workerError) throw workerError;

                alert(`✔ Worker Created Successfully!\nID: ${generatedEmail}\n(Auto-generated for internal use)`);
                // navigate('/admin/accounts');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder-gray-400 dark:placeholder-white/20";
    const labelClasses = "block text-xs font-bold uppercase opacity-60 mb-2 tracking-wide text-gray-500 dark:text-gray-400";

    if (createdWorker) {
        return (
            <Layout title="Worker Registration">
                <div className="max-w-4xl mx-auto py-8">
                    <div className="glass-card p-10 rounded-[3rem] border border-gray-200 dark:border-white/10 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 bg-white dark:bg-white/5">
                        <div className="w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={48} />
                        </div>

                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Worker Account Created!</h2>
                            <p className="opacity-60 text-lg text-gray-500 dark:text-gray-400">You can now register their face in the Workers List.</p>
                        </div>

                        <div className="p-8 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5 max-w-sm mx-auto">
                            <p className="font-bold text-xl mb-4 text-gray-900 dark:text-white">{createdWorker.name}</p>
                            <p className="text-xs font-mono opacity-50 break-all text-gray-500 dark:text-gray-400">{createdWorker.id}</p>
                        </div>

                        <div className="flex flex-col gap-4 max-w-sm mx-auto">
                            <button
                                onClick={() => navigate('/admin/workers')}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-blue-500/25"
                            >
                                <Camera size={24} />
                                GO TO WORKERS LIST & SCAN
                            </button>

                            <button
                                onClick={() => navigate('/admin/accounts')}
                                className="w-full py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-2xl font-bold uppercase tracking-widest transition-colors"
                            >
                                Create Another Account
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Worker Registration">
            <div className="max-w-4xl mx-auto py-8">
                <button onClick={() => navigate('/admin/accounts')} className="mb-6 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Back to Accounts
                </button>

                <div className="glass-card p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-white/5">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-white/10">
                        <div className="bg-orange-500/10 dark:bg-orange-500/20 p-4 rounded-2xl">
                            <User className="text-orange-600 dark:text-orange-400 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register Support Staff</h2>
                            <p className="opacity-60 text-gray-500 dark:text-gray-400">Watchmen, Cleaners, Security, etc.</p>
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
                                <input required className={inputClasses} placeholder="Worker Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Role</label>
                                <select className={inputClasses} style={{ colorScheme: 'light dark' }} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option>Cleaner</option>
                                    <option>Watchman</option>
                                    <option>Security Guard</option>
                                    <option>Peon</option>
                                    <option>Pharmacy Assistant</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Daily Salary (₹)</label>
                                <input required type="number" className={inputClasses} value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Phone Number</label>
                                <input className={inputClasses} placeholder="Optional" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Address</label>
                                <textarea className={`${inputClasses} h-24 resize-none`} placeholder="Home Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                            </div>
                        </div>

                        <button disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50">
                            {loading ? "Creating Record..." : "Register Worker"}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
