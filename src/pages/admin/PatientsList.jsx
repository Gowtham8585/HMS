import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { UserPlus, Search, Phone, History, Edit, Trash2, X } from "lucide-react";

export default function PatientsList() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingPatient, setEditingPatient] = useState(null);

    useEffect(() => {
        loadPatients();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('patients_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                (payload) => {
                    console.log('Patient change detected:', payload);
                    loadPatients(); // Reload when any change occurs
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function loadPatients() {
        setLoading(true);
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) setPatients(data);
        setLoading(false);
    }

    const deletePatient = async (id) => {
        if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) return;

        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (error) {
            alert("Error deleting patient: " + error.message);
        } else {
            loadPatients();
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('patients').update({
            full_name: editingPatient.full_name,
            date_of_birth: editingPatient.date_of_birth,
            gender: editingPatient.gender,
            phone: editingPatient.phone,
            medical_history: editingPatient.medical_history
        }).eq('id', editingPatient.id);

        if (!error) {
            setEditingPatient(null);
            loadPatients();
        } else {
            alert("Error updating: " + error.message);
        }
        setLoading(false);
    };

    function calculateAge(dob) {
        if (!dob) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout title="Patient Records">
            <div className="py-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl font-bold opacity-80 flex items-center gap-2 text-gray-900 dark:text-white">
                        <UserPlus className="text-emerald-500" />
                        Registered Patients
                    </h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20"
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
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Patient Name</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Age/Gender</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Contact Info</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Medical History</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-20 text-center text-gray-500 dark:text-gray-400 font-medium">Loading patients...</td></tr>
                                ) : filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-bold border border-emerald-100 dark:border-emerald-500/30">
                                                    {patient.full_name?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-gray-900 dark:text-white">{patient.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="text-gray-600 dark:text-gray-200">{calculateAge(patient.date_of_birth)} Years</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-black">{patient.gender}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <Phone className="w-4 h-4" />
                                                {patient.phone}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="max-w-xs truncate text-gray-500 dark:text-gray-400 text-sm">
                                                {patient.medical_history || 'No history recorded'}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingPatient(patient)}
                                                    className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-sm border border-blue-100 dark:border-blue-500/10"
                                                    title="Edit Patient"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deletePatient(patient.id)}
                                                    className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-500/10"
                                                    title="Delete Patient"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="p-20 text-center text-gray-500 dark:text-gray-400">No patients found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {editingPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="glass-card w-full max-w-lg p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl relative bg-white dark:bg-[#1a1c23]">
                            <button onClick={() => setEditingPatient(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X size={20} />
                            </button>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                                <Edit className="text-blue-500" />
                                Edit Patient Details
                            </h3>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-500 dark:text-white">Full Name</label>
                                    <input
                                        required
                                        className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all"
                                        value={editingPatient.full_name}
                                        onChange={e => setEditingPatient({ ...editingPatient, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-500 dark:text-white">Date of Birth</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all"
                                            value={editingPatient.date_of_birth || ''}
                                            onChange={e => setEditingPatient({ ...editingPatient, date_of_birth: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-500 dark:text-white">Gender</label>
                                        <select
                                            className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all"
                                            value={editingPatient.gender}
                                            onChange={e => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                                            style={{ colorScheme: 'light dark' }}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-500 dark:text-white">Phone Number</label>
                                    <input
                                        className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all"
                                        value={editingPatient.phone}
                                        onChange={e => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-500 dark:text-white">Medical History</label>
                                    <textarea
                                        className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white h-24 resize-none transition-all"
                                        value={editingPatient.medical_history}
                                        onChange={e => setEditingPatient({ ...editingPatient, medical_history: e.target.value })}
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setEditingPatient(null)} className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 font-bold uppercase text-sm tracking-widest transition-all text-gray-500 dark:text-white">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-sm tracking-widest shadow-lg shadow-blue-500/20 transition-all">
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
