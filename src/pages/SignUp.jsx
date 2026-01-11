import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import hmsLogo from "../assets/hms_logo.png";
import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function SignUp() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("patient");
    const [specialization, setSpecialization] = useState("");
    const [error, setError] = useState("");
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signUp(email, password, name, role, specialization);
            alert("✔ Account Created Successfully!");
            navigate("/");
        } catch (err) {
            setError("Failed to create account. " + err.message);
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
                    className="p-2 glass-card rounded-lg hover:opacity-80 transition-all text-blue-600"
                    title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            {/* ... inside component ... */}
            <div className="max-w-md w-full glass-card rounded-2xl shadow-2xl p-8 border border-white/20 my-10 transition-all">
                <div className="flex flex-col items-center mb-6">
                    <img src={hmsLogo} alt="HMS Logo" className="h-20 w-auto mb-2 drop-shadow-sm opacity-80" />
                    <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 tracking-tight">
                        HMS
                    </h1>
                </div>

                <h2 className="text-3xl font-bold text-center text-blue-600 mb-8 uppercase tracking-wide">
                    Create Account
                </h2>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex items-center">
                        <span className="text-xl mr-2">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full p-4 bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all dark:text-white"
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full p-4 bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all dark:text-white"
                            placeholder="e.g. john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full p-4 bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all dark:text-white"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">Select Role</label>
                        <select
                            className="w-full p-4 bg-white/5 dark:bg-slate-900 border-2 border-gray-200 dark:border-white/10 rounded-lg text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all dark:text-white"
                            style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="patient">Patient</option>
                            <option value="coworker">Staff (Co-Worker)</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {role === 'doctor' && (
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2 text-lg">Medical Specialization</label>
                            <select
                                className="w-full p-4 bg-white/5 dark:bg-slate-900 border-2 border-gray-200 dark:border-white/10 rounded-lg text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all dark:text-white"
                                style={{ colorScheme: theme === 'dark' ? 'dark' : 'light' }}
                                required
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                            >
                                <option value="">Select Specialization</option>
                                <option value="General Physician">General Physician</option>
                                <option value="Cardiologist">Cardiologist</option>
                                <option value="Dermatologist">Dermatologist</option>
                                <option value="Neurologist">Neurologist</option>
                                <option value="Pediatrician">Pediatrician</option>
                                <option value="Psychiatrist">Psychiatrist</option>
                                <option value="Gynecologist">Gynecologist</option>
                                <option value="ENT Specialist">ENT Specialist</option>
                                <option value="Orthopedic">Orthopedic</option>
                                <option value="Dentist">Dentist</option>
                                <option value="Physiotherapist">Physiotherapist</option>
                                <option value="Surgeon">Surgeon</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    )}
                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg text-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-70 shadow-lg hover:shadow-xl transform active:scale-95"
                    >
                        {loading ? "Creating..." : "Sign Up"}
                    </button>
                </form>

                <div className="mt-6 text-center text-lg">
                    <p className="text-gray-600">
                        Already have an account?{" "}
                        <Link to="/login" className="text-blue-600 font-bold hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
