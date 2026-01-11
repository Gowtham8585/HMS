import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { CheckCircle, Clock, Calendar } from "lucide-react";

export default function Attendance() {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [checkedInToday, setCheckedInToday] = useState(false);
    const [checkedOutToday, setCheckedOutToday] = useState(false);
    const [todayRecordId, setTodayRecordId] = useState(null);

    useEffect(() => {
        if (user) loadAttendance();
    }, [user]);

    const loadAttendance = async () => {
        const today = new Date().toISOString().split('T')[0];

        // Load history (last 10 days)
        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(10);

        setHistory(data || []);

        // Check status for today
        const todayRecord = data?.find(r => r.date === today);
        if (todayRecord) {
            setTodayRecordId(todayRecord.id);
            if (todayRecord.in_time) setCheckedInToday(true);
            if (todayRecord.out_time) setCheckedOutToday(true);
        }
    };

    const handleCheckIn = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('attendance')
            .insert([{
                user_id: user.id,
                user_type: role === 'coworker' ? 'receptionist' : role,
                status: 'present',
                in_time: new Date().toISOString()
            }]);

        if (!error) {
            alert("✔ Checked In Successfully!");
            loadAttendance();
        } else if (error.code === '23505') {
            alert("You have already checked in today!");
        } else {
            alert("Error: " + error.message);
        }
        setLoading(false);
    };

    const handleCheckOut = async () => {
        if (!todayRecordId) return;
        setLoading(true);
        const { error } = await supabase
            .from('attendance')
            .update({
                out_time: new Date().toISOString()
            })
            .eq('id', todayRecordId);

        if (!error) {
            alert("✔ Checked Out Successfully!");
            loadAttendance();
        } else {
            alert("Error: " + error.message);
        }
        setLoading(false);
    };

    return (
        <Layout title="Attendance Tracker">
            <div className="max-w-2xl mx-auto space-y-8 py-6">
                {/* Check-In/Out Card */}
                <div className="glass-card p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                    <h2 className="text-3xl font-extrabold mb-4 opacity-90 text-gray-900 dark:text-white">Shift Management</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
                        {!checkedInToday
                            ? "Ready to start your shift?"
                            : !checkedOutToday
                                ? "You are currently on duty. Don't forget to check out!"
                                : "You have completed your shift for today."}
                    </p>

                    <div className="flex flex-col gap-4">
                        {!checkedInToday ? (
                            <button
                                onClick={handleCheckIn}
                                disabled={loading}
                                className="w-full py-6 rounded-2xl text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/20 transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-4"
                            >
                                <Clock size={32} />
                                {loading ? "PROCESSING..." : "CHECK IN"}
                            </button>
                        ) : !checkedOutToday ? (
                            <button
                                onClick={handleCheckOut}
                                disabled={loading}
                                className="w-full py-6 rounded-2xl text-2xl font-black bg-gradient-to-r from-orange-500 to-rose-600 text-white hover:shadow-orange-500/20 transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-4 animate-pulse"
                            >
                                <Clock size={32} />
                                {loading ? "PROCESSING..." : "CHECK OUT"}
                            </button>
                        ) : (
                            <div className="w-full py-6 rounded-2xl text-2xl font-black bg-gray-50 dark:bg-white/5 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-4">
                                <CheckCircle size={32} className="text-emerald-500" />
                                SHIFT COMPLETED
                            </div>
                        )}
                    </div>
                </div>

                {/* History Table */}
                <div className="glass-card p-8 rounded-3xl shadow-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Calendar size={24} className="text-blue-600 dark:text-blue-500" />
                        Recent History
                    </h3>
                    <div className="space-y-4">
                        {history.length > 0 ? history.map((record) => (
                            <div key={record.id} className={`flex items-center justify-between p-5 rounded-2xl border ${record.in_time && !record.out_time ? 'bg-indigo-50 dark:bg-indigo-500/5 border-indigo-200 dark:border-indigo-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5'}`}>
                                <div>
                                    <p className="font-black text-lg tracking-tight text-gray-900 dark:text-white">{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    <div className="flex gap-4 mt-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            IN: {record.in_time ? new Date(record.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-white/10 pl-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                            OUT: {record.out_time ? new Date(record.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (record.in_time && !record.out_time ? 'Dutying...' : 'N/A')}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${record.status === 'present' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/20'}`}>
                                    {record.status}
                                </span>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 py-10">No attendance history found yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
