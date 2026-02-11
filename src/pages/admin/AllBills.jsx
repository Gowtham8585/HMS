import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Receipt, DollarSign, Search, Trash2 } from "lucide-react";

export default function AllBills() {
    const [groupedBills, setGroupedBills] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedGroup, setSelectedGroup] = useState(null);

    useEffect(() => {
        loadBills();
    }, []);

    const loadBills = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bills')
            .select(`
                *,
                patient:patient_id (name, patient_type)
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Group by Patient ID (or Name if ID missing)
            const groups = {};

            data.forEach(bill => {
                const pName = bill.patient_name || bill.patient?.name || 'Unknown Patient';
                const pId = bill.patient_id || pName; // Fallback to name as key

                const pType = bill.patient?.patient_type || (bill.patient_id ? 'permanent' : 'temporary');

                if (!groups[pId]) {
                    groups[pId] = {
                        id: pId,
                        name: pName,
                        type: pType,
                        bills: [],
                        totalSpent: 0,
                        lastVisit: bill.created_at
                    };
                }

                // Parse items if string
                let parsedItems = bill.items;
                if (typeof parsedItems === 'string') {
                    try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = []; }
                }
                // Unwrap object wrappers
                if (!Array.isArray(parsedItems) && parsedItems && typeof parsedItems === 'object') {
                    if (Array.isArray(parsedItems.items)) parsedItems = parsedItems.items;
                    else if (Array.isArray(parsedItems.medicines)) parsedItems = parsedItems.medicines;
                    else if (Array.isArray(parsedItems.data)) parsedItems = parsedItems.data;
                }

                // Attach items properly
                const processedBill = {
                    ...bill,
                    items: Array.isArray(parsedItems) ? parsedItems : []
                };

                groups[pId].bills.push(processedBill);
                groups[pId].totalSpent += bill.total_amount || 0;
            });

            // Convert to array and sort by latest visit
            const sortedGroups = Object.values(groups).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
            setGroupedBills(sortedGroups);
        }
        setLoading(false);
    };

    const deleteBill = async (billId, groupId) => {
        if (!confirm("Are you sure you want to delete this bill? This cannot be undone.")) return;

        // 1. Delete associated bill items first to avoid FK constraint error
        const { error: itemsError } = await supabase.from('bill_items').delete().eq('bill_id', billId);

        if (itemsError) {
            console.warn("Could not delete bill items (might not exist):", itemsError.message);
            // Proceed anyway as it might have failed because table is empty or RLS, but we try the main bill deletion.
        }

        // 2. Delete the bill itself
        const { error } = await supabase.from('bills').delete().eq('id', billId);

        if (error) {
            alert("Error deleting bill: " + error.message);
        } else {
            // Update UI locally
            const newGroups = groupedBills.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        bills: g.bills.filter(b => b.id !== billId),
                        totalSpent: g.bills.filter(b => b.id !== billId).reduce((sum, b) => sum + b.total_amount, 0)
                    };
                }
                return g;
            }).filter(g => g.bills.length > 0); // Remove group if no bills left

            setGroupedBills(newGroups);

            // Update modal data if open
            if (selectedGroup && selectedGroup.id === groupId) {
                const updatedGroup = newGroups.find(g => g.id === groupId);
                setSelectedGroup(updatedGroup || null);
            }
        }
    };

    return (
        <Layout title="Billing History & Patients">
            {/* Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-white/10 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{selectedGroup.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-white/50 font-mono">Total Spent: ₹{selectedGroup.totalSpent.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => setSelectedGroup(null)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body - List of Bills */}
                        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar bg-white dark:bg-[#1a1c23]">
                            {selectedGroup.bills.map((bill, index) => (
                                <div key={bill.id} className="relative pl-8 border-l-2 border-gray-200 dark:border-white/10 pb-8 last:pb-0">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#1a1c23]"></div>

                                    {/* Bill Header */}
                                    <div className="flex justify-between items-start mb-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-lg">
                                                {new Date(bill.created_at).toLocaleDateString()}
                                                <span className="opacity-50 text-xs ml-2 font-normal text-gray-500 dark:text-white/50">
                                                    {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </p>
                                            <p className="text-xs font-mono opacity-40 uppercase tracking-widest text-gray-500 dark:text-white/40">{bill.id.slice(0, 8)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-emerald-600 dark:text-emerald-400 text-xl">₹{bill.total_amount.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Bill Items */}
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden mb-4 border border-gray-200 dark:border-white/5">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 dark:bg-white/5 text-left font-bold opacity-60 text-gray-600 dark:text-gray-400">
                                                <tr>
                                                    <th className="p-3 pl-4">Item</th>
                                                    <th className="p-3 text-right">Qty</th>
                                                    <th className="p-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                                {bill.items && bill.items.length > 0 ? bill.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td className="p-3 pl-4 text-gray-700 dark:text-gray-300">{item.name || item.medicine_name || 'Unknown'}</td>
                                                        <td className="p-3 text-right opacity-60 font-mono text-gray-600 dark:text-gray-400">{item.qty || item.quantity || 1}</td>
                                                        <td className="p-3 text-right font-bold text-gray-800 dark:text-gray-200">₹{((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString()}</td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan="3" className="p-4 text-center italic opacity-40 text-gray-500">No items listed</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Delete Button */}
                                    <div className="text-right">
                                        <button
                                            onClick={() => deleteBill(bill.id, selectedGroup.id)}
                                            className="text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center justify-end gap-1 ml-auto"
                                        >
                                            <Trash2 size={12} /> Delete Record
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="py-6 space-y-8">
                {/* Stats */}
                <div className="glass-card p-6 rounded-3xl flex items-center gap-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="p-4 bg-green-500/20 text-green-600 dark:text-green-500 rounded-2xl">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Total Revenue</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">₹{groupedBills.reduce((acc, g) => acc + g.totalSpent, 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="glass-card rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">S.No</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-gray-500 dark:text-gray-400">Patient Name</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-center text-gray-500 dark:text-gray-400">Visits</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-right text-gray-500 dark:text-gray-400">Total Spent</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-right text-gray-500 dark:text-gray-400">Last Visit</th>
                                    <th className="p-6 font-bold uppercase tracking-wider text-sm opacity-60 text-right text-gray-500 dark:text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-20 text-center text-gray-500 dark:text-gray-400">Loading records...</td></tr>
                                ) : groupedBills.length > 0 ? groupedBills.map((group, index) => (
                                    <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-6 text-sm opacity-50 text-gray-500 dark:text-gray-400">{index + 1}</td>
                                        <td className="p-6 font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                            {group.name}
                                            {group.type === 'temporary' && (
                                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">Temp</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-center font-mono opacity-70">
                                            <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg text-gray-700 dark:text-gray-300">{group.bills.length}</span>
                                        </td>
                                        <td className="p-6 text-right font-black text-lg text-emerald-600 dark:text-emerald-400">
                                            ₹{group.totalSpent.toLocaleString()}
                                        </td>
                                        <td className="p-6 text-right opacity-60 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(group.lastVisit).toLocaleDateString()}
                                        </td>
                                        <td className="p-6 text-right">
                                            <button
                                                onClick={() => setSelectedGroup(group)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all"
                                            >
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="6" className="p-20 text-center text-gray-500 dark:text-gray-400">No records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
