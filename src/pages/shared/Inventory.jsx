import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, AlertTriangle, Pill, Search, TrendingDown, TrendingUp, X, Edit, Filter, Trash2 } from "lucide-react";

export default function Inventory() {
    const { role } = useAuth();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingMed, setEditingMed] = useState(null);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name"); // name, type, expiry, arrival
    const [newMed, setNewMed] = useState({
        medicine_name: '',
        medicine_type: 'Tablet',
        stock_quantity: 0,
        expiry_date: '',
        manufacture_date: '',
        stock_coming_date: new Date().toISOString().split('T')[0],
        price: 0
    });

    const MEDICINE_TYPES = [
        "Tablet",
        "Capsule",
        "Syrup",
        "Injection",
        "Ointment/Cream",
        "Inhaler",
        "Drops",
        "Lotion",
        "General Medicine",
        "Other"
    ];

    useEffect(() => {
        fetchMedicines();
        const sub = supabase.channel('medicines')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, fetchMedicines)
            .subscribe();
        return () => sub.unsubscribe();
    }, []);

    const fetchMedicines = async () => {
        setLoading(true);
        const { data } = await supabase.from('medicines').select('*').order('medicine_name');
        if (data) setMedicines(data);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const payload = { ...newMed };
        if (!payload.medicine_type) payload.medicine_type = 'General Medicine';

        const { error } = await supabase.from('medicines').insert([payload]);
        if (!error) {
            setShowAdd(false);
            setNewMed({
                medicine_name: '',
                medicine_type: 'Tablet',
                stock_quantity: 0,
                expiry_date: '',
                manufacture_date: '',
                stock_coming_date: new Date().toISOString().split('T')[0],
                price: 0
            });
            alert("✔ Medicine Added Successfully");
        } else {
            alert("Error adding medicine: " + error.message);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const { error } = await supabase
            .from('medicines')
            .update({
                medicine_name: editingMed.medicine_name,
                medicine_type: editingMed.medicine_type,
                stock_quantity: editingMed.stock_quantity,
                expiry_date: editingMed.expiry_date,
                manufacture_date: editingMed.manufacture_date,
                stock_coming_date: editingMed.stock_coming_date,
                price: editingMed.price
            })
            .eq('id', editingMed.id);

        if (!error) {
            setEditingMed(null);
            fetchMedicines();
            alert("✔ Medicine Updated Successfully");
        } else {
            alert("Error updating medicine: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this medicine? This action cannot be undone.")) return;
        const { error } = await supabase.from('medicines').delete().eq('id', id);
        if (!error) {
            setEditingMed(null);
            fetchMedicines();
            alert("✔ Medicine Removed from Catalog");
        } else {
            alert("Error deleting medicine: " + error.message);
        }
    };

    const updateStock = async (id, current, delta) => {
        const newStock = Math.max(0, current + delta);
        await supabase.from('medicines').update({ stock_quantity: newStock }).eq('id', id);
        fetchMedicines();
    };

    const sortedMedicines = [...medicines].sort((a, b) => {
        if (sortBy === 'name') return (a.medicine_name || '').localeCompare(b.medicine_name || '');
        if (sortBy === 'type') return (a.medicine_type || '').localeCompare(b.medicine_type || '');
        if (sortBy === 'expiry') return new Date(a.expiry_date || '9999-12-31') - new Date(b.expiry_date || '9999-12-31');
        if (sortBy === 'arrival') return new Date(b.stock_coming_date || '1970-01-01') - new Date(a.stock_coming_date || '1970-01-01');
        return 0;
    });

    const filteredMedicines = sortedMedicines.filter(m =>
        m.medicine_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.medicine_type?.toLowerCase().includes(search.toLowerCase())
    );

    const isExpired = (date) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20";
    const labelClasses = "block text-sm font-bold opacity-60 mb-2 uppercase tracking-widest text-gray-500 dark:text-white";

    return (
        <Layout title="Pharmacy Inventory">
            <div className="py-6 space-y-8">
                {/* Global Expiry Alert */}
                {medicines.some(m => isExpired(m.expiry_date)) && (
                    <div className="bg-red-500/10 border-2 border-red-500/50 p-6 rounded-3xl flex items-center gap-6 animate-pulse shadow-2xl shadow-red-500/10">
                        <div className="bg-red-500 p-4 rounded-2xl shadow-lg">
                            <AlertTriangle className="text-white w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-red-600 dark:text-red-500 tracking-tight uppercase">CRITICAL: EXPIRED MEDICINES DETECTED</h3>
                            <p className="text-sm font-bold opacity-60 text-gray-900 dark:text-white">System alert sent to all clinical staff. Please isolate and remove expired inventory immediately.</p>
                        </div>
                    </div>
                )}

                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-rose-50 dark:bg-rose-500/20 p-3 rounded-2xl">
                            <Pill className="text-rose-600 dark:text-rose-500 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold opacity-80 text-gray-900 dark:text-white">Stock Management</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage medicine availability</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search inventory..."
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    className="pl-9 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm appearance-none min-w-[120px] text-gray-900 dark:text-white"
                                    style={{ colorScheme: 'light dark' }}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="name">Sort: Name</option>
                                    <option value="type">Sort: Type</option>
                                    <option value="expiry">Sort: Expiry</option>
                                    <option value="arrival">Sort: Arrival</option>
                                </select>
                            </div>
                        </div>
                        {role === 'admin' && (
                            <button
                                onClick={() => setShowAdd(true)}
                                className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Add Item</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Add Modal */}
                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-card w-full max-w-lg p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl relative overflow-y-auto max-h-[90vh] bg-white dark:bg-[#1a1c23]">
                            <button onClick={() => setShowAdd(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><Plus className="text-rose-600 dark:text-rose-500" />Add Medicine</h3>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Medicine Type</label>
                                    <select
                                        required
                                        className={inputClasses}
                                        style={{ colorScheme: 'light dark' }}
                                        value={newMed.medicine_type}
                                        onChange={e => setNewMed({ ...newMed, medicine_type: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {MEDICINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Medicine Name</label>
                                    <input required className={inputClasses} placeholder="e.g. Paracetamol" value={newMed.medicine_name} onChange={e => setNewMed({ ...newMed, medicine_name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Arrival Date</label>
                                        <input type="date" required className={inputClasses} value={newMed.stock_coming_date} onChange={e => setNewMed({ ...newMed, stock_coming_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Mfg Date</label>
                                        <input type="date" required className={inputClasses} value={newMed.manufacture_date} onChange={e => setNewMed({ ...newMed, manufacture_date: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Expiry Date</label>
                                    <input type="date" required className={`${inputClasses} ${isExpired(newMed.expiry_date) ? 'border-red-500 focus:ring-red-500 text-red-600 dark:text-red-500' : ''}`} value={newMed.expiry_date} onChange={e => setNewMed({ ...newMed, expiry_date: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Unit Price (₹)</label>
                                        <input type="number" step="0.01" required className={inputClasses} placeholder="0.00" value={newMed.price} onChange={e => setNewMed({ ...newMed, price: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Total Stock Amount</label>
                                        <input type="number" required className={inputClasses} placeholder="100" value={newMed.stock_quantity} onChange={e => setNewMed({ ...newMed, stock_quantity: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1 text-rose-500 dark:text-rose-400">Estimated Inventory Value</p>
                                    <p className="text-2xl font-black text-rose-600 dark:text-rose-500">₹{((newMed.price || 0) * (newMed.stock_quantity || 0)).toLocaleString()}</p>
                                </div>
                                <button className="w-full bg-rose-600 text-white p-4 rounded-xl font-bold text-lg mt-4 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20 font-black tracking-widest uppercase">
                                    REGISTER STOCK
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingMed && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-card w-full max-w-lg p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl relative overflow-y-auto max-h-[90vh] bg-white dark:bg-[#1a1c23]">
                            <button onClick={() => setEditingMed(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><Edit className="text-blue-600 dark:text-blue-500" />Edit Medicine</h3>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Medicine Type</label>
                                    <select
                                        required
                                        className={inputClasses}
                                        style={{ colorScheme: 'light dark' }}
                                        value={editingMed.medicine_type}
                                        onChange={e => setEditingMed({ ...editingMed, medicine_type: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {MEDICINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Medicine Name</label>
                                    <input required className={inputClasses} placeholder="e.g. Paracetamol" value={editingMed.medicine_name} onChange={e => setEditingMed({ ...editingMed, medicine_name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Arrival Date</label>
                                        <input type="date" required className={inputClasses} value={editingMed.stock_coming_date} onChange={e => setEditingMed({ ...editingMed, stock_coming_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Mfg Date</label>
                                        <input type="date" required className={inputClasses} value={editingMed.manufacture_date} onChange={e => setEditingMed({ ...editingMed, manufacture_date: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Expiry Date</label>
                                    <input type="date" required className={`${inputClasses} ${isExpired(editingMed.expiry_date) ? 'border-red-500 focus:ring-red-500 text-red-600 dark:text-red-500' : ''}`} value={editingMed.expiry_date} onChange={e => setEditingMed({ ...editingMed, expiry_date: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Unit Price (₹)</label>
                                        <input type="number" step="0.01" required className={inputClasses} placeholder="0.00" value={editingMed.price} onChange={e => setEditingMed({ ...editingMed, price: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Total Stock Amount</label>
                                        <input type="number" required className={inputClasses} placeholder="100" value={editingMed.stock_quantity} onChange={e => setEditingMed({ ...editingMed, stock_quantity: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1 text-blue-600 dark:text-blue-500">Total Valuation</p>
                                    <p className="text-2xl font-black text-blue-600 dark:text-blue-500">₹{((editingMed.price || 0) * (editingMed.stock_quantity || 0)).toLocaleString()}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(editingMed.id)}
                                        className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 p-4 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={20} /> DELETE
                                    </button>
                                    <button className="bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-black tracking-widest uppercase">
                                        SAVE CHANGES
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Inventory List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-gray-400 font-medium tracking-widest italic animate-pulse">Scanning inventory...</div>
                    ) : filteredMedicines.length > 0 ? filteredMedicines.map(m => (
                        <div
                            key={m.id}
                            className={`glass-card p-6 rounded-3xl border transition-all hover:border-rose-500/30 flex items-center justify-between group bg-white dark:bg-white/5 ${isExpired(m.expiry_date) ? 'border-red-600 bg-red-600/10' : (m.stock_quantity < 10 ? 'border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10' : 'border-gray-200 dark:border-white/10')}`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired(m.expiry_date) ? 'bg-red-600 text-white' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
                                        <Pill size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">{m.medicine_name}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-tighter opacity-40 text-gray-500 dark:text-white">{m.medicine_type}</p>
                                    </div>
                                    {isExpired(m.expiry_date) && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600 text-[10px] font-black uppercase text-white animate-bounce">
                                            <AlertTriangle className="w-3 h-3" /> EXPIRED
                                        </span>
                                    )}
                                    {!isExpired(m.expiry_date) && m.stock_quantity < 10 && (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500 text-[10px] font-black uppercase text-white animate-pulse">
                                            <AlertTriangle className="w-3 h-3" /> Low
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm font-bold mb-4">
                                    <div className="flex flex-col">
                                        <span className="opacity-40 uppercase text-[9px] tracking-widest mb-1 text-gray-500 dark:text-white">Unit Price</span>
                                        <span className="text-gray-900 dark:text-white">₹{m.price}</span>
                                    </div>
                                    <div className="flex flex-col border-l border-gray-200 dark:border-white/10 pl-5">
                                        <span className="opacity-40 uppercase text-[9px] tracking-widest mb-1 text-gray-500 dark:text-white">Total Stock</span>
                                        <span className={m.stock_quantity < 10 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>{m.stock_quantity} Units</span>
                                    </div>
                                    <div className="flex flex-col border-l border-gray-200 dark:border-white/10 pl-5">
                                        <span className="opacity-40 uppercase text-[9px] tracking-widest mb-1 text-gray-500 dark:text-white">Total Value</span>
                                        <span className="text-rose-600 dark:text-rose-500 font-black">₹{(m.price * m.stock_quantity).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-[10px] uppercase font-black tracking-widest opacity-60 text-gray-500 dark:text-white">
                                    <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-lg text-center">
                                        <span className="block opacity-40 mb-1">Arrival</span>
                                        <span>{m.stock_coming_date ? new Date(m.stock_coming_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-lg text-center">
                                        <span className="block opacity-40 mb-1">Mfg</span>
                                        <span>{m.manufacture_date ? new Date(m.manufacture_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className={`p-2 rounded-lg text-center ${isExpired(m.expiry_date) ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-white/5'}`}>
                                        <span className="block opacity-40 mb-1">Expiry</span>
                                        <span>{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-center group-hover:scale-110 transition-transform">
                                    <span className={`block text-4xl font-black ${m.stock_quantity < 10 ? 'text-red-600 dark:text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {m.stock_quantity}
                                    </span>
                                    <span className="text-[10px] opacity-40 uppercase font-black tracking-widest text-gray-500 dark:text-white">In Stock</span>
                                </div>

                                {role === 'admin' && (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => updateStock(m.id, m.stock_quantity, 5)}
                                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5 group/btn"
                                            title="Quick Restock: +5 Units"
                                        >
                                            <Plus className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => setEditingMed(m)}
                                            className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/5 group/btn"
                                            title="Edit Details"
                                        >
                                            <Edit className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => updateStock(m.id, m.stock_quantity, -1)}
                                            className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-orange-500/5 group/btn"
                                            title="Remove 1 unit"
                                        >
                                            <TrendingDown className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center text-gray-500 dark:text-gray-400 italic">No medicines found matching your search.</div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
