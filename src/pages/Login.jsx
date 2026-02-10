import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

import { useNavigate, Link } from "react-router-dom";
import hmsLogo from "../assets/hms_logo.png";
import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            // Auth wrapper handles redirect based on role
            navigate("/");
        } catch (err) {
            setError(err.message || "Failed to log in. Check email/password.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className="p-2 glass-card rounded-lg hover:opacity-80 transition-all text-blue-600 dark:text-blue-400"
                    title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>


            <div className="max-w-md w-full glass-card rounded-2xl shadow-2xl p-8 border border-white/20 transition-all bg-white/80 dark:bg-[#0f172a]/80">
                <div className="flex flex-col items-center mb-8">
                    <img src={hmsLogo} alt="HMS Logo" className="h-28 w-auto mb-4 drop-shadow-md hover:scale-105 transition-transform" />
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 tracking-tight">
                        HMS
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Hospital Management System</p>
                </div>

                <h2 className="text-2xl font-bold text-center mb-6 uppercase tracking-wide opacity-90 text-gray-900 dark:text-white">
                    Login
                </h2>

                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded mb-6 flex items-center">
                        <span className="text-xl mr-2">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full p-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full p-4 pr-12 bg-gray-50 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg text-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-70 shadow-lg hover:shadow-xl transform active:scale-95"
                    >
                        {loading ? "Logging in..." : "LOG IN"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    <p className="opacity-50 mb-2">Protected System. Access restricted to authorized personnel.</p>
                </div>
            </div>
        </div>
    );
}
