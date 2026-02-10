import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Users, Search, Mail, Edit, Trash2, X } from "lucide-react";

export default function StaffList() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingStaff, setEditingStaff] = useState(null);

    useEffect(() => {
        loadStaff();
    }, []);

    async function loadStaff() {
        setLoading(true);
        // Query the dedicated staff table
        const { data, error } = await supabase
            .from('staff')
            .select('*')
            .order('name'); // Role filter is not needed if staff table only has staff, or we filter by column

        if (!error) setStaff(data || []);
        setLoading(false);
    }

    const deleteStaff = async (id) => {
        if (!confirm("Are you sure you want to remove this staff member?")) return;

        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) {
            alert("Error deleting staff: " + error.message);
        } else {
            loadStaff();
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('staff').update({
            name: editingStaff.name,
            role: editingStaff.role,
        }).eq('id', editingStaff.id);

        if (!error) {
            setEditingStaff(null);
            loadStaff();
        } else {
            alert("Error updating: " + error.message);
        }
        setLoading(false);
    };

    const filteredStaff = staff.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout title="Staff Directory">
            <div className="py-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl font-bold opacity-80 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Users className="text-purple-600 dark:text-purple-500" />
                        Clinical Support Staff
                    </h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Staff Name</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Email Address</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Role</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-20 text-center text-gray-500 dark:text-gray-400 font-medium">Loading staff...</td></tr>
                                ) : filteredStaff.length > 0 ? filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-500 font-bold border border-purple-100 dark:border-purple-500/30">
                                                    {member.name?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-gray-900 dark:text-white">{member.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Mail className="w-4 h-4" />
                                                {member.email}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-100 dark:border-purple-500/20">
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingStaff(member)}
                                                    className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-500/10"
                                                    title="Edit Staff"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteStaff(member.id)}
                                                    className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-500/10"
                                                    title="Remove Staff"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="p-20 text-center text-gray-500 dark:text-gray-400">No staff members found matching your search.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {editingStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl relative bg-white dark:bg-[#1a1c23]">
                            <button onClick={() => setEditingStaff(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X size={20} />
                            </button>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                                <Edit className="text-purple-500" />
                                Edit Staff Profile
                            </h3>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-500 dark:text-white">Full Name</label>
                                    <input
                                        required
                                        className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                                        value={editingStaff.name}
                                        onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-500 dark:text-white">Email (Read Only)</label>
                                    <input
                                        readOnly
                                        disabled
                                        className="w-full p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-500 cursor-not-allowed"
                                        value={editingStaff.email}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-500 dark:text-white">Role</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition-all"
                                        value={editingStaff.role}
                                        onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                                        style={{ colorScheme: 'light dark' }}
                                    >
                                        <option value="receptionist">Receptionist</option>
                                        <option value="coworker">Coworker (Legacy)</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 font-bold uppercase text-sm tracking-widest transition-all text-gray-500 dark:text-white">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase text-sm tracking-widest shadow-lg shadow-purple-500/20 transition-all">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
