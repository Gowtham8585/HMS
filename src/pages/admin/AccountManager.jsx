import Layout from "../../components/Layout";
import { UserPlus, Shield, User, Stethoscope, Briefcase, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccountManager() {
    const navigate = useNavigate();

    const roles = [
        {
            id: 'doctor',
            name: 'Create Doctor Account',
            icon: Stethoscope,
            color: 'from-blue-500 to-cyan-600',
            description: 'Medical professional with patient care access',
            path: '/admin/accounts/doctor'
        },
        {
            id: 'receptionist',
            name: 'Create Receptionist',
            icon: Briefcase,
            color: 'from-purple-500 to-indigo-600',
            description: 'Manages appointments, billing, and patient registration',
            path: '/admin/accounts/receptionist'
        },
        {
            id: 'worker',
            name: 'Register Worker',
            icon: User,
            color: 'from-orange-500 to-amber-600',
            description: 'Support staff like watchman, cleaner, peon',
            path: '/admin/accounts/worker'
        },
        {
            id: 'admin',
            name: 'Create Administrator',
            icon: Shield,
            color: 'from-red-500 to-rose-600',
            description: 'Full system access and management',
            path: '/admin/accounts/admin'
        }
    ];

    return (
        <Layout title="Account Management">
            <div className="max-w-6xl mx-auto py-8">
                <div className="flex items-center gap-4 mb-10">
                    <div className="bg-blue-600 dark:bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10 shadow-lg dark:shadow-none">
                        <UserPlus className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">Create Staff Accounts</h2>
                        <p className="opacity-60 text-lg text-gray-600 dark:text-white/60">Select the type of account you wish to create</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => navigate(role.path)}
                            // Keeps white text because cards are colored gradients in both modes
                            className={`group relative overflow-hidden rounded-[2rem] p-8 bg-gradient-to-br ${role.color} shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-95 transition-all duration-300 text-left`}
                        >
                            <div className="relative z-10 flex items-start justify-between">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                                        <role.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-white mb-2 leading-tight">{role.name}</h4>
                                        <p className="text-sm text-white/80 leading-relaxed max-w-xs font-medium">{role.description}</p>
                                    </div>
                                </div>
                                <div className="bg-white/20 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                                    <ArrowRight className="text-white" />
                                </div>
                            </div>

                            {/* Decorative Background Elements */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/0 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
