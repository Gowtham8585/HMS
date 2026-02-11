import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Wallet, Users, Stethoscope, Search, DollarSign, Edit, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export default function Payroll() {
    const [doctors, setDoctors] = useState([]);
    const [staff, setStaff] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' or 'staff'
    const [editingEmployee, setEditingEmployee] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        // Load Doctors
        const { data: docData } = await supabase.from('doctors').select('*').order('name');
        setDoctors(docData || []);

        // Load Staff (profiles with role coworker)
        const { data: staffData } = await supabase.from('profiles').select('*').in('role', ['receptionist', 'coworker']).order('name');
        setStaff(staffData || []);

        // Load Current Month Attendance
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: attData } = await supabase
            .from('attendance')
            .select('*')
            .gte('date', startOfMonth.toISOString().split('T')[0]);

        setAttendance(attData || []);

        setLoading(false);
    }

    const getAttendanceStats = (userId) => {
        const userAtt = attendance.filter(a => a.user_id === userId);
        let fullDays = 0;
        let halfDays = 0;

        userAtt.forEach(record => {
            // Support both old (in_time) and new (check_in) columns for transition if needed, but per schema we use check_in
            const inTime = record.check_in || record.in_time;
            const outTime = record.check_out || record.out_time;

            if (inTime && outTime) {
                const duration = (new Date(outTime) - new Date(inTime)) / (1000 * 60 * 60);
                if (duration >= 8) fullDays++;
                else if (duration >= 4) halfDays++;
                else halfDays++; // Any check-in counts as half
            } else if (inTime) {
                halfDays++; // Checked in but not out yet or missing data
            } else if (record.status === 'present') {
                fullDays++; // Manual entries
            }
        });

        const effectiveDays = fullDays + (halfDays * 0.5);
        return { fullDays, halfDays, effectiveDays };
    };

    const handleUpdateSalary = async (e) => {
        e.preventDefault();
        const table = editingEmployee.type === 'doctor' ? 'doctors' : 'profiles';
        const { error } = await supabase
            .from(table)
            .update({
                per_day_salary: parseFloat(editingEmployee.per_day_salary),
                salary: parseFloat(editingEmployee.salary), // Manual/Total
                payment_status: editingEmployee.payment_status
            })
            .eq('id', editingEmployee.id);

        if (!error) {
            alert("✔ Payroll updated successfully!");
            setEditingEmployee(null);
            loadData();
        } else {
            alert("Error: " + error.message);
        }
    };

    const filteredEmployees = (activeTab === 'doctor' ? doctors : staff).filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase())
    );

    const calculateTotal = () => {
        return [...doctors, ...staff].reduce((acc, curr) => {
            const userId = curr.user_id || curr.id;
            const stats = getAttendanceStats(userId);
            const autoSalary = (curr.per_day_salary || 0) * stats.effectiveDays;
            return acc + (autoSalary || parseFloat(curr.salary) || 0);
        }, 0);
    };

    const totalBudget = calculateTotal();
    const paidCount = [...doctors, ...staff].filter(e => e.payment_status === 'paid').length;
    const pendingCount = [...doctors, ...staff].length - paidCount;

    return (
        <Layout title="Payroll Management">
            <div className="py-6 space-y-8">
                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-white/10 flex items-center gap-6 bg-white dark:bg-white/5">
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-4 rounded-2xl">
                            <TrendingUp className="text-emerald-600 dark:text-emerald-500 w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-gray-500 dark:text-white">Monthly Budget</p>
                            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{totalBudget.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-white/10 flex items-center gap-6 bg-white dark:bg-white/5">
                        <div className="bg-blue-500/10 dark:bg-blue-500/20 p-4 rounded-2xl">
                            <CheckCircle className="text-blue-600 dark:text-blue-500 w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-gray-500 dark:text-white">Paid Employees</p>
                            <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">{paidCount}</h3>
                        </div>
                    </div>
                    <div className="glass-card p-6 rounded-3xl border border-gray-200 dark:border-white/10 flex items-center gap-6 bg-white dark:bg-white/5">
                        <div className="bg-rose-500/10 dark:bg-rose-500/20 p-4 rounded-2xl">
                            <XCircle className="text-rose-600 dark:text-rose-500 w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-gray-500 dark:text-white">Pending Payments</p>
                            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">{pendingCount}</h3>
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-500/20 p-3 rounded-2xl">
                            <Wallet className="text-emerald-600 dark:text-emerald-500 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold opacity-80 text-gray-900 dark:text-white">Attendance Based Payroll</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Yield: (Rate × Effective Days)</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
                            <button
                                onClick={() => setActiveTab('doctor')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'doctor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <Stethoscope size={16} /> Doctors
                            </button>
                            <button
                                onClick={() => setActiveTab('staff')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'staff' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <Users size={16} /> Staff
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                className="pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm w-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Payroll Table */}
                <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="p-6 font-bold uppercase tracking-wider text-[10px] opacity-40 text-gray-500 dark:text-white">Employee</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-[10px] opacity-40 text-gray-500 dark:text-white">Rate / Day</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-[10px] opacity-40 text-gray-500 dark:text-white">Attendance</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-[10px] opacity-40 text-gray-500 dark:text-white">Calculated Yield</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-[10px] opacity-40 text-right text-gray-500 dark:text-white">Status</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-[10px] opacity-40 text-right text-gray-500 dark:text-white">Edit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-20 text-center text-gray-500 dark:text-gray-400 italic font-medium tracking-wide">Calculating present days...</td></tr>
                                ) : filteredEmployees.length > 0 ? filteredEmployees.map((emp) => {
                                    const stats = getAttendanceStats(emp.user_id || emp.id);
                                    const autoSalary = (emp.per_day_salary || 0) * stats.effectiveDays;
                                    const displayName = emp.name?.startsWith('Dr.') ? emp.name : (activeTab === 'doctor' ? `Dr. ${emp.name}` : emp.name);

                                    return (
                                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${activeTab === 'doctor' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20'}`}>
                                                        {emp.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-lg block leading-none text-gray-900 dark:text-white">{displayName}</span>
                                                        <span className="text-[10px] opacity-40 font-black uppercase tracking-widest text-gray-500 dark:text-white">
                                                            {activeTab === 'doctor' ? (emp.specialization || 'Clinical Doctor') : 'Support Staff'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 font-bold text-gray-600 dark:text-gray-300">
                                                ₹{(emp.per_day_salary || 0).toLocaleString()}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-black text-gray-900 dark:text-white">{stats.effectiveDays}</span>
                                                    <span className="text-[10px] uppercase font-bold opacity-30 mt-1 text-gray-600 dark:text-white">Days</span>
                                                </div>
                                                <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter text-gray-500 dark:text-white">
                                                    {stats.fullDays} Full • {stats.halfDays} Half
                                                </p>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{autoSalary.toLocaleString()}</div>
                                                <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest text-gray-500 dark:text-white">Auto Estimate</p>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${emp.payment_status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                    {emp.payment_status || 'unpaid'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button
                                                    onClick={() => setEditingEmployee({ ...emp, type: activeTab })}
                                                    className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="6" className="p-20 text-center text-gray-500 dark:text-gray-400 italic">No employees found in this category.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Salary Modal */}
                {editingEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-card w-full max-w-sm p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl relative bg-white dark:bg-[#1a1c23]">
                            <button onClick={() => setEditingEmployee(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><XCircle className="w-6 h-6" /></button>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                                <DollarSign className="text-emerald-600 dark:text-emerald-500" />
                                Configure Payout
                            </h3>
                            <form onSubmit={handleUpdateSalary} className="space-y-6">
                                <div>
                                    <p className="text-sm font-bold opacity-40 mb-1 uppercase tracking-widest text-gray-500 dark:text-white">Employee Name</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{editingEmployee.name?.startsWith('Dr.') ? editingEmployee.name : (editingEmployee.type === 'doctor' ? `Dr. ${editingEmployee.name}` : editingEmployee.name)}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold opacity-60 mb-2 uppercase tracking-widest text-gray-500 dark:text-white">Daily Rate (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-xl font-black text-emerald-600 dark:text-emerald-400"
                                            value={editingEmployee.per_day_salary || 0}
                                            onChange={e => setEditingEmployee({ ...editingEmployee, per_day_salary: e.target.value })}
                                        />
                                    </div>
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl">
                                        <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1 text-indigo-500 dark:text-indigo-300">Monthly Yield (Auto)</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">₹{((editingEmployee.per_day_salary || 0) * getAttendanceStats(editingEmployee.user_id || editingEmployee.id).effectiveDays).toLocaleString()}</span>
                                            <span className="text-[10px] font-bold opacity-40 mb-1 text-gray-500 dark:text-white">/ {getAttendanceStats(editingEmployee.user_id || editingEmployee.id).effectiveDays} days</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold opacity-60 mb-2 uppercase tracking-widest text-gray-500 dark:text-white">Manual Override / Bonus (₹)</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-gray-400"
                                        placeholder="Enter total if not auto..."
                                        value={editingEmployee.salary || 0}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, salary: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold opacity-60 mb-2 uppercase tracking-widest text-gray-500 dark:text-white">Payment Status</label>
                                    <select
                                        className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white font-bold"
                                        style={{ colorScheme: 'light dark' }}
                                        value={editingEmployee.payment_status || 'unpaid'}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, payment_status: e.target.value })}
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                        <option value="partially_paid">Partially Paid</option>
                                    </select>
                                </div>
                                <button className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 font-black tracking-widest uppercase">
                                    SAVE CONFIGURATION
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
