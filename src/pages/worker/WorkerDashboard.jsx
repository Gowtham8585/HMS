
import Layout from "../../components/Layout";
import { useAuth } from "../../contexts/AuthContext";

export default function WorkerDashboard() {
    const { user, userName } = useAuth();

    return (
        <Layout title="Worker Portal">
            <div className="p-8">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white shadow-xl mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome, {userName || 'Worker'}</h1>
                    <p className="opacity-90">Manage your tasks and view attendance below.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">My Attendance</h3>
                        <p className="text-gray-500">Attendance history will be shown here.</p>
                        {/* Placeholder for future attendance list */}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
