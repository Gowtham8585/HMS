import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import DashboardButton from "../../components/DashboardButton";
import { Users, Stethoscope, Pill, Receipt, BarChart3, UserCheck, UserPlus, Activity, Clock, Wallet, Briefcase } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ doctors: 0, staff: 0, patients: 0, medicines: 0, workers: 0, lowStock: 0, expiredCount: 0 });

    useEffect(() => {
        async function getStats() {
            const { count: docCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
            const { count: staffCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['receptionist', 'coworker']);
            const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
            const { count: workerCount } = await supabase.from('workers').select('*', { count: 'exact', head: true });
            const { data: medData } = await supabase.from('medicines').select('medicine_name, medicine_type, stock_quantity, expiry_date');

            // Count unique medicine categories/types, excluding "General Medicine"
            const medicineCategories = [...new Set(medData
                ?.filter(m => m.medicine_type?.toLowerCase() !== 'general medicine')
                .map(m => m.medicine_type)
                .filter(Boolean)
            )];

            const lowStockCount = medData?.filter(m => m.stock_quantity < 10).length || 0;
            const expiredCount = medData?.filter(m => m.expiry_date && new Date(m.expiry_date) < new Date()).length || 0;

            setStats({
                doctors: docCount || 0,
                staff: staffCount || 0,
                patients: patientCount || 0,
                medicines: medicineCategories.length || 0,
                workers: workerCount || 0,
                lowStock: lowStockCount,
                expiredCount: expiredCount
            });
        }
        getStats();
    }, []);

    return (
        <Layout title="Admin Dashboard">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-indigo-500/50 transition-all shadow-lg dark:shadow-none">
                    <div>
                        <p className="text-sm font-bold opacity-60 uppercase tracking-widest text-gray-500 dark:text-gray-400">Doctors</p>
                        <h3 className="text-4xl font-black mt-1 text-indigo-600 dark:text-indigo-400">{stats.doctors}</h3>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-2xl">
                        <Stethoscope className="text-indigo-600 dark:text-indigo-500 w-8 h-8" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-purple-500/50 transition-all shadow-lg dark:shadow-none">
                    <div>
                        <p className="text-sm font-bold opacity-60 uppercase tracking-widest text-gray-500 dark:text-gray-400">Support Staff</p>
                        <h3 className="text-4xl font-black mt-1 text-purple-600 dark:text-purple-400">{stats.staff}</h3>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-2xl">
                        <Users className="text-purple-600 dark:text-purple-500 w-8 h-8" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-emerald-500/50 transition-all shadow-lg dark:shadow-none">
                    <div>
                        <p className="text-sm font-bold opacity-60 uppercase tracking-widest text-gray-500 dark:text-gray-400">Patients</p>
                        <h3 className="text-4xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{stats.patients}</h3>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-2xl">
                        <UserPlus className="text-emerald-600 dark:text-emerald-500 w-8 h-8" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-cyan-500/50 transition-all shadow-lg dark:shadow-none">
                    <div>
                        <p className="text-sm font-bold opacity-60 uppercase tracking-widest text-gray-500 dark:text-gray-400">Workers</p>
                        <h3 className="text-4xl font-black mt-1 text-cyan-600 dark:text-cyan-400">{stats.workers}</h3>
                    </div>
                    <div className="bg-cyan-50 dark:bg-cyan-500/10 p-4 rounded-2xl">
                        <Briefcase className="text-cyan-600 dark:text-cyan-500 w-8 h-8" />
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold opacity-80 flex items-center gap-2 mb-6 text-gray-900 dark:text-white">
                    <BarChart3 className="text-blue-600 dark:text-blue-500" />
                    Management Console
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DashboardButton
                        title="Doctors"
                        icon={Stethoscope}
                        to="/admin/doctors"
                        color="from-indigo-500 to-blue-700"
                    />
                    <DashboardButton
                        title="Staff"
                        icon={Users}
                        to="/admin/staff"
                        color="from-purple-500 to-indigo-700"
                    />
                    <DashboardButton
                        title="Patients"
                        icon={UserPlus}
                        to="/admin/patients"
                        color="from-emerald-500 to-teal-700"
                    />
                    <DashboardButton
                        title="Medicines"
                        icon={Pill}
                        to="/admin/medicines"
                        color="from-rose-500 to-red-700"
                        alert={stats.expiredCount > 0}
                    />
                    <DashboardButton
                        title="Doctor & Staff Attendance"
                        icon={UserCheck}
                        to="/admin/attendance"
                        color="from-cyan-500 to-blue-700"
                    />
                    <DashboardButton
                        title="All Bills"
                        icon={Receipt}
                        to="/admin/bills"
                        color="from-green-500 to-emerald-700"
                    />
                    <DashboardButton
                        title="Payroll & Salary"
                        icon={Wallet}
                        to="/admin/payroll"
                        color="from-amber-500 to-orange-700"
                    />
                    <DashboardButton
                        title="Workers List"
                        icon={Users}
                        to="/admin/workers"
                        color="from-slate-600 to-slate-800"
                    />
                    <DashboardButton
                        title="Create Accounts"
                        icon={UserPlus}
                        to="/admin/accounts"
                        color="from-blue-500 to-indigo-700"
                    />
                    <DashboardButton
                        title="Hospital Setup"
                        icon={Activity}
                        to="/admin/settings"
                        color="from-sky-500 to-blue-800"
                    />
                </div>
            </div>
        </Layout>
    );
}
