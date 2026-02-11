import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Stethoscope, Plus, Search, X, Calendar, User, UserPlus, Trash2, Edit2, Link as LinkIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function DoctorsList() {
    const { role: currentUserRole } = useAuth();
    const [doctors, setDoctors] = useState([]);
    // ... rest of state ...
    const [profiles, setProfiles] = useState([]); // Registered doctor profiles
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false); // Can be removed later if not needed for anything else, but safe to keep for now
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [newDoctor, setNewDoctor] = useState({ name: "", specialization: "", availability: "", profile_id: "" });
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        loadDoctors();
        if (currentUserRole === 'admin') {
            loadDoctorProfiles();
        }

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('doctors_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'doctors' },
                (payload) => {
                    console.log('Doctor change detected:', payload);
                    loadDoctors(); // Reload when any change occurs
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [currentUserRole]);

    async function loadDoctors() {
        setLoading(true);
        setFetchError(null);
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .order('full_name');

            if (error) {
                console.error("Error loading doctors:", error);
                setFetchError(error.message);
            } else {
                setDoctors(data || []);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setFetchError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    const SPECIALIZATIONS = [
        "General Physician",
        "Cardiologist",
        "Dermatologist",
        "Neurologist",
        "Pediatrician",
        "Psychiatrist",
        "Gynecologist",
        "ENT Specialist",
        "Orthopedic",
        "Dentist",
        "Physiotherapist",
        "Surgeon",
        "Oncologist",
        "Endocrinologist",
        "Other"
    ];

    const AVAILABILITY_SLOTS = [
        "Full Time (Mon-Sat, 9AM-5PM)",
        "Morning Shift (9AM-1PM)",
        "Evening Shift (4PM-8PM)",
        "Night Shift (8PM-12AM)",
        "Weekends Only",
        "On Call",
        "Emergency Only",
        "Tuesday & Thursday",
        "Mon-Wed-Fri"
    ];

    async function loadDoctorProfiles() {
        const { data } = await supabase
            .from('profiles')
            .select('id, name, email, specialization')
            .eq('role', 'doctor');
        if (data) setProfiles(data);
    }

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...newDoctor };
            if (!payload.profile_id) delete payload.profile_id;

            const { error } = await supabase
                .from('doctors')
                .insert([payload]);

            if (error) {
                alert("Error adding doctor: " + error.message);
            } else {
                setShowAdd(false);
                setNewDoctor({ name: "", specialization: "General Physician", availability: "Full Time (Mon-Sat, 9AM-5PM)", profile_id: "" });
                loadDoctors();
                alert("✔ Doctor added successfully!");
            }
        } catch (err) {
            alert("Unexpected error adding doctor");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDoctor = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('doctors')
                .update({
                    name: editingDoctor.name,
                    specialization: editingDoctor.specialization,
                    availability: editingDoctor.availability,
                    // If address is something you want to support updating in the future, you'd add it here too.
                    // But for now, let's keep it consistent with what's being edited.
                    // Update standard fields
                })
                .eq('id', editingDoctor.id);

            // Also update the profile address if it exists there
            await supabase.from('profiles').update({
                name: editingDoctor.name,
                specialization: editingDoctor.specialization,
                // address: editingDoctor.address // If we had it in state
            }).eq('id', editingDoctor.id);

            if (error) {
                alert("Error updating doctor: " + error.message);
            } else {
                setEditingDoctor(null);
                loadDoctors();
                alert("✔ Doctor updated successfully!");
            }
        } catch (err) {
            alert("Unexpected error updating doctor");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDoctor = async (id) => {
        if (!confirm("Are you sure you want to remove this doctor from the directory?")) return;

        const { error } = await supabase
            .from('doctors')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error deleting doctor: " + error.message);
        } else {
            loadDoctors();
            alert("Doctor removed successfully");
        }
    };

    const filteredDoctors = doctors.filter(d =>
        d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase())
    );

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20";
    const labelClasses = "block text-sm font-bold opacity-60 mb-2 uppercase tracking-widest text-gray-500 dark:text-white";

    return (
        <Layout title="Doctors Directory">
            <div className="py-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 dark:bg-indigo-500/20 p-3 rounded-2xl">
                            <Stethoscope className="text-indigo-600 dark:text-indigo-500 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold opacity-80 text-gray-900 dark:text-white">Professional Medical Staff</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage clinical practitioners and specialists</p>
                        </div>
                    </div>

                    <div className="flex w-full md:w-auto gap-4">
                        <button onClick={loadDoctors} className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-white" title="Refresh List">
                            <LinkIcon size={20} className={loading ? "animate-spin" : ""} />
                        </button>
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search directory..."
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-gray-900 dark:text-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {fetchError && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                        <X className="w-5 h-5" />
                        <span className="font-medium">Error: {fetchError}</span>
                        <button onClick={loadDoctors} className="ml-auto underline font-bold">Retry</button>
                    </div>
                )}


                {/* Edit Doctor Modal */}
                {editingDoctor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-card w-full max-w-lg p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl relative bg-white dark:bg-[#1a1c23]">
                            <button onClick={() => setEditingDoctor(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><Edit2 className="text-blue-500" /> Edit Doctor Info</h3>
                            <form onSubmit={handleUpdateDoctor} className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Doctor Name</label>
                                    <input required className={inputClasses} value={editingDoctor.full_name} onChange={e => setEditingDoctor({ ...editingDoctor, full_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Specialization</label>
                                    <select
                                        className={inputClasses}
                                        style={{ colorScheme: 'light dark' }}
                                        value={editingDoctor.specialization}
                                        onChange={e => setEditingDoctor({ ...editingDoctor, specialization: e.target.value })}
                                    >
                                        {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg mt-4 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-black">UPDATE DOCTOR</button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Doctor Name</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Specialization</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Availability</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {loading && doctors.length === 0 ? (
                                    <tr><td colSpan="4" className="p-20 text-center text-gray-400 font-medium tracking-widest italic opacity-50 animate-pulse">Loading directory...</td></tr>
                                ) : filteredDoctors.length > 0 ? filteredDoctors.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-500 font-black text-xl">
                                                    {doc.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block text-gray-900 dark:text-white">Dr. {doc.full_name}</span>
                                                    <span className="text-[10px] opacity-40 uppercase font-black tracking-widest text-gray-500 dark:text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-4 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                                                {doc.specialization}
                                            </span>
                                        </td>
                                        <td className="p-6 text-gray-500 dark:text-gray-400 italic font-medium">
                                            {doc.available_days && doc.available_days.length > 0
                                                ? `${doc.available_days.join(', ')} (${doc.available_from || ''} - ${doc.available_to || ''})`
                                                : 'Not specified'}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setEditingDoctor(doc)}
                                                    className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all border border-blue-100 dark:border-blue-500/10"
                                                    title="Edit Doctor"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {currentUserRole === 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteDoctor(doc.id)}
                                                        className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all border border-rose-100 dark:border-rose-500/10"
                                                        title="Delete Doctor"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-24 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="bg-gray-100 dark:bg-white/5 p-6 rounded-3xl">
                                                    <Stethoscope className="w-16 h-16 opacity-10 text-gray-500 dark:text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold opacity-40 text-gray-500 dark:text-white">No doctors found in directory</p>
                                                    <p className="text-sm opacity-30 mt-1 text-gray-500 dark:text-white">Add doctors to make them available for appointments</p>
                                                </div>
                                                {currentUserRole === 'admin' && (
                                                    <div className="text-sm opacity-50 mt-4 italic font-bold text-gray-500 dark:text-white">
                                                        Go to Admin Dashboard &gt; Staff Accounts <br /> to register new medical personnel.
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
