import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Home, Sun, Moon } from "lucide-react";

const Layout = ({ children, title }) => {
    const { logout, user, userName } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            <header className="bg-white/80 dark:bg-slate-900/80 text-gray-800 dark:text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-blue-600 dark:text-blue-400">
                        <Home size={28} />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide truncate">
                        {title || "Clinic System"}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {user && (
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                {userName || "User"}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
                                {user.email}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-blue-600 dark:text-sky-400"
                        title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    {user && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-bold shadow-lg shadow-red-500/20 active:scale-95"
                            title="Logout"
                        >
                            <span className="hidden sm:inline">Logout</span>
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </header>
            <main className="flex-1 p-4 md:p-6 w-full max-w-5xl mx-auto">
                {children}
            </main>
        </div>
    );
}

export default Layout;
