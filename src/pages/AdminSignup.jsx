
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Shield, Lock, AlertCircle, CheckCircle, Mail, User, Phone, MapPin } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminSignup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

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

        try {
            // 1. Sign Up
            const { data, error: signUpError } = await supabase.auth.signUp({
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
                // 2. Insert into Profiles
                const { error: profileError } = await supabase.from('profiles').insert([{
                    id: data.user.id,
                    email: formData.email,
                    role: 'admin',
                    name: formData.name // Important for Auth Context
                }]);

                if (profileError) throw profileError;

                // 3. Insert into Admins Table
                const { error: adminError } = await supabase.from('admins').insert([{
                    id: data.user.id,
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address
                }]);

                if (adminError) throw adminError;

                setSuccess(true);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-slate-900 transition-colors">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-white/5 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Account Created!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Your admin account has been registered successfully. You can now log in to the dashboard.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/25 active:scale-95"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const inputClasses = "w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder-gray-400";
    const labelClasses = "block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 tracking-wider";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-slate-900 dark:to-black font-sans transition-colors">

            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">

                {/* Left Side - Hero */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-red-600 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
                            <Shield size={32} className="text-white" />
                        </div>
                        <h1 className="text-5xl font-black leading-tight mb-6">
                            Admin <br /> Portal
                        </h1>
                        <p className="text-red-100 text-lg leading-relaxed opacity-90">
                            Create your administrative account to manage the hospital system, doctors, staff, and inventories securely.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
                        <p className="text-sm opacity-75">Already have an account?</p>
                        <Link to="/login" className="inline-flex items-center gap-2 font-bold hover:underline mt-2">
                            Log In Here →
                        </Link>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="md:hidden mb-8 text-center">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Admin Signup</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Create your secure account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-pulse">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={labelClasses}>Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        required
                                        className={inputClasses}
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className={labelClasses}>Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        required
                                        className={inputClasses}
                                        placeholder="admin@hospital.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className={labelClasses}>Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        className={inputClasses}
                                        placeholder="••••••••"
                                        minLength={6}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className={labelClasses}>Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="tel"
                                        className={inputClasses}
                                        placeholder="+91..."
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className={labelClasses}>Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        placeholder="City / HQ"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">Creating Account...</span>
                            ) : (
                                <>
                                    <span>Create Admin Account</span>
                                    <Shield size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="md:hidden mt-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Already have an account? <Link to="/login" className="text-red-600 font-bold">Log In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
