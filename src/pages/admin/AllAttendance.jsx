import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Clock, Users, RefreshCw, UserCheck, Stethoscope, AlertCircle, Calculator } from "lucide-react";

export default function AllAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [users, setUsers] = useState({ doctors: [], staff: [], workers: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('doctor'); // 'doctor', 'receptionist', 'worker', 'summary_doctor', etc
    const [expandedRow, setExpandedRow] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();

        const attendanceTracker = supabase.channel('attendance_global')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
                loadData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(attendanceTracker);
        };
    }, []);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch Users Data
            const { data: docList } = await supabase.from('doctors').select('*');
            const { data: staffList } = await supabase.from('profiles').select('*');
            const { data: workerList } = await supabase.from('workers').select('*');

            setUsers({
                doctors: docList || [],
                staff: staffList || [],
                workers: workerList || []
            });

            // 2. Fetch Attendance (RAW)
            // We do NOT use join here because it complicates polymorphic relationships.
            // We will map it manually in JS.
            const { data: attendanceData, error: fetchError } = await supabase
                .from('attendance')
                .select('*')
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;

            // 3. Enrich Data
            const enriched = (attendanceData || []).map(record => {
                let name = "Unknown";
                let role = "unknown";

                // Strategy 1: Check Workers Table
                // Workers table uses Auth ID as Primary Key
                const worker = (workerList || []).find(w => w.id === record.user_id);
                if (worker) {
                    name = worker.name;
                    role = 'worker';
                }
                // Strategy 2: Check Doctors Table
                else {
                    // Doctors table uses user_id for Auth ID
                    const doctor = (docList || []).find(d => d.user_id === record.user_id);
                    if (doctor) {
                        name = doctor.full_name || doctor.name;
                        role = 'doctor';
                    }
                    // Strategy 3: Check Profiles (Staff)
                    else {
                        // Profiles table uses user_id for Auth ID
                        const staff = (staffList || []).find(s => s.user_id === record.user_id);
                        if (staff) {
                            name = staff.full_name || staff.name;
                            role = staff.role || 'receptionist';
                            if (role === 'coworker') role = 'receptionist'; // Normalize
                        }
                    }
                }

                return {
                    ...record,
                    profiles: { name, role }
                };
            });

            setAttendance(enriched);

        } catch (err) {
            console.error(err);
            setError("Failed to load data: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    const calculateStats = (userId) => {
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const userMonthAtt = attendance.filter(a =>
            a.user_id === userId &&
            (a.date && a.date.startsWith(monthPrefix))
        );

        let full = 0;
        let half = 0;
        userMonthAtt.forEach(record => {
            const inTime = record.check_in;
            const outTime = record.check_out;

            if (inTime && outTime) {
                const hrs = (new Date(outTime) - new Date(inTime)) / (1000 * 3600);
                if (hrs >= 8) full++;
                else if (hrs >= 4) half++;
                else half++;
            } else if (inTime) {
                half++;
            } else if (record.status === 'present') {
                full++;
            }
        });

        const effective = full + (half * 0.5);
        return { full, half, effective };
    };

    const getSummary = () => {
        let type = 'staff';
        let sourceData = users.staff.filter(u => ['receptionist', 'coworker', 'staff', 'nurse'].includes(u.role));

        if (activeTab === 'summary_doctor') {
            type = 'doctor';
            sourceData = users.doctors;
        } else if (activeTab === 'summary_worker') {
            type = 'worker';
            sourceData = users.workers || [];
        }

        return sourceData.map(emp => {
            // Correctly identify the Auth ID for the user
            // Doctors & Profile/Staff tables use 'user_id' to link to auth.users
            // Workers table uses 'id' (which is the auth.id)
            const userIdForAttendance = emp.user_id || emp.id;
            const stats = calculateStats(userIdForAttendance);
            const salary = (emp.per_day_salary || 0) * stats.effective;

            const rawName = emp.name || "Unknown";
            const displayName = type === 'doctor' ? (rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`) : rawName;

            return { ...emp, stats, salary, displayName, type };
        }).filter(item => item.stats.effective > 0);
    };

    const filteredAttendance = attendance.filter(record => {
        if (activeTab === 'receptionist') return record.profiles?.role === 'receptionist' || record.profiles?.role === 'coworker' || record.profiles?.role === 'staff';
        return record.profiles?.role === activeTab;
    });

    return (
        <Layout title="Attendance & Payroll Summary">
            <div className="py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 dark:bg-indigo-500/20 p-3 rounded-2xl">
                            <UserCheck className="text-indigo-600 dark:text-indigo-500 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold opacity-80 text-gray-900 dark:text-white">
                                {activeTab.startsWith('summary') ? 'Monthly Payout Summary' : 'Attendance Monitoring'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {activeTab.startsWith('summary') ? 'Automated salary calculation based on work hours' : 'Live check-in/out tracking'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10 w-full lg:w-auto gap-1">
                        <button onClick={() => setActiveTab('doctor')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex-1 ${activeTab === 'doctor' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Stethoscope size={14} /> Daily Doc
                        </button>
                        <button onClick={() => setActiveTab('receptionist')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex-1 ${activeTab === 'receptionist' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Users size={14} /> Daily Staff
                        </button>
                        <button onClick={() => setActiveTab('worker')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex-1 ${activeTab === 'worker' ? 'bg-slate-700 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Users size={14} /> Daily Workers
                        </button>
                        <div className="w-px h-8 bg-gray-300 dark:bg-white/10 mx-1 self-center hidden sm:block" />
                        <button onClick={() => setActiveTab('summary_doctor')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex-1 ${activeTab === 'summary_doctor' ? 'bg-emerald-500 text-white shadow-lg' : 'text-emerald-500/80 dark:text-emerald-500/40'}`}>
                            <Calculator size={14} /> Dr. Summary
                        </button>
                        <button onClick={() => setActiveTab('summary_staff')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex-1 ${activeTab === 'summary_staff' ? 'bg-teal-500 text-white shadow-lg' : 'text-teal-500/80 dark:text-teal-500/40'}`}>
                            <Calculator size={14} /> Staff Summary
                        </button>
                        <button onClick={() => setActiveTab('summary_worker')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex-1 ${activeTab === 'summary_worker' ? 'bg-slate-500 text-white shadow-lg' : 'text-slate-500/80 dark:text-slate-500/40'}`}>
                            <Calculator size={14} /> Worker Summary
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 uppercase font-bold text-[10px] opacity-40 tracking-widest text-gray-500 dark:text-gray-400">
                                {activeTab.startsWith('summary') ? (
                                    <tr>
                                        <th className="p-6" colSpan="4">Employee List</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="p-6">Date</th>
                                        <th className="p-6">Name</th>
                                        <th className="p-6">Check In</th>
                                        <th className="p-6">Check Out</th>
                                        <th className="p-6 text-right">Status</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-20 text-center text-gray-400 italic">Processing records...</td></tr>
                                ) : activeTab.startsWith('summary') ? (
                                    getSummary().length > 0 ? getSummary().map((item) => (
                                        <>
                                            <tr
                                                key={item.id}
                                                onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                                                className={`cursor-pointer transition-all border-b border-gray-100 dark:border-white/5 ${expandedRow === item.id ? 'bg-gray-50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                            >
                                                <td className="p-6" colSpan={expandedRow === item.id ? 1 : 4}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${expandedRow === item.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-indigo-500 dark:text-indigo-400'}`}>
                                                                {item.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-lg block leading-none text-gray-900 dark:text-white">{item.displayName}</span>
                                                                <span className="text-[10px] opacity-40 uppercase tracking-widest font-black text-gray-500 dark:text-gray-400">
                                                                    {item.type === 'doctor' ? (item.specialization || 'Doctor') : 'Support Staff'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`transition-transform duration-300 ${expandedRow === item.id ? 'rotate-180' : ''} text-gray-500`}>
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRow === item.id && (
                                                <tr className="bg-gray-50/50 dark:bg-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <td colSpan="4" className="p-6 pt-0">
                                                        <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-black/20 rounded-2xl p-6 mt-2 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                                                            <div className="flex-1 space-y-1">
                                                                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 dark:opacity-40 tracking-widest">Daily Rate</p>
                                                                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">₹{(item.per_day_salary || 0).toLocaleString()}</p>
                                                            </div>
                                                            <div className="w-px bg-gray-200 dark:bg-white/10 hidden md:block"></div>
                                                            <div className="flex-1 space-y-1">
                                                                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 dark:opacity-40 tracking-widest">Attendance</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-2xl font-black text-gray-900 dark:text-white">{item.stats.effective}</span>
                                                                    <span className="text-[10px] uppercase font-black opacity-40 mt-1 text-gray-500 dark:text-gray-400">Days</span>
                                                                </div>
                                                                <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter text-gray-500 dark:text-gray-400">
                                                                    {item.stats.full} Full • {item.stats.half} Half
                                                                </p>
                                                            </div>
                                                            <div className="w-px bg-gray-200 dark:bg-white/10 hidden md:block"></div>
                                                            <div className="flex-1 space-y-1 text-right md:text-left">
                                                                <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest text-emerald-600 dark:text-emerald-500/80">Estimated Salary</p>
                                                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{item.salary.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )) : (
                                        <tr><td colSpan="4" className="p-24 text-center text-gray-500 italic">No attendance data for the current month.</td></tr>
                                    )
                                ) : (
                                    filteredAttendance.length > 0 ? filteredAttendance.map((record) => {
                                        // Robust time checking
                                        const checkInIndex = record.check_in;
                                        const checkOutIndex = record.check_out;

                                        return (
                                            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                <td className="p-6 font-medium text-gray-600 dark:text-gray-300">
                                                    {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-6 font-bold text-lg text-gray-900 dark:text-white">{record.profiles?.name || 'Unknown'}</td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                                                        <Clock size={14} className="opacity-40" />
                                                        {checkInIndex ?
                                                            new Date(checkInIndex).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : 'N/A'
                                                        }
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className={`flex items-center gap-2 font-bold ${checkOutIndex ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 italic animate-pulse'}`}>
                                                        <Clock size={14} className="opacity-40" />
                                                        {checkOutIndex ?
                                                            new Date(checkOutIndex).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : (checkInIndex ? 'On Duty...' : 'N/A')
                                                        }
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${record.status === 'present' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan="5" className="p-24 text-center text-gray-500 italic font-medium opacity-40">
                                                No records for {activeTab}.
                                                <br />
                                                <span className="text-[10px] uppercase tracking-widest opacity-50 mt-2 block">
                                                    Ensure 'check_in' column exists & user scanned successfully
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button onClick={loadData} className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest border border-gray-200 dark:border-white/10">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Sync Data
                    </button>
                </div>
            </div>
        </Layout >
    );
}
