import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Search, User, Pill, Plus, Trash2, Printer, CheckCircle } from "lucide-react";

export default function Billing() {
    const [patients, setPatients] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [searchPatient, setSearchPatient] = useState("");
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [billItems, setBillItems] = useState([]);
    const [recentPrescriptions, setRecentPrescriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedPatient) {
            fetchPrescriptions();
        } else {
            setRecentPrescriptions([]);
        }
    }, [selectedPatient]);

    const fetchData = async () => {
        const { data: pData } = await supabase.from('patients').select('*').order('full_name');
        if (pData) setPatients(pData);

        const { data: mData } = await supabase.from('medicines').select('*').gt('stock_quantity', 0).order('medicine_name');
        if (mData) setMedicines(mData);
    };

    const fetchPrescriptions = async () => {
        const today = new Date().toISOString().split('T')[0];
        // Fetch prescriptions created today (or all recent)
        const { data } = await supabase
            .from('prescriptions')
            .select(`
                *,
                prescription_items (
                    *,
                    medicines (id, medicine_name, price)
                )
            `)
            .eq('patient_id', selectedPatient.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setRecentPrescriptions(data);
    };

    const addItem = () => {
        setBillItems([...billItems, { medicine_id: "", quantity: 1, unit_price: 0, subtotal: 0 }]);
    };

    const removeItem = (index) => {
        setBillItems(billItems.filter((_, i) => i !== index));
    };

    // Add all items from a prescription to the bill
    const loadPrescriptionToBill = (prescription) => {
        const newItems = [...billItems];

        prescription.prescription_items.forEach(pItem => {
            const med = pItem.medicines;
            if (med) {
                newItems.push({
                    medicine_id: med.id,
                    quantity: pItem.quantity || 1,
                    unit_price: med.price || 0,
                    subtotal: (pItem.quantity || 1) * (med.price || 0)
                });
            }
        });

        setBillItems(newItems);
        // Remove from view optional? Or keep it reference. Let's keep it.
        // setRecentPrescriptions(prev => prev.filter(p => p.id !== prescription.id));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...billItems];
        newItems[index][field] = value;

        if (field === 'medicine_id') {
            const med = medicines.find(m => m.id === value);
            if (med) {
                newItems[index].unit_price = med.price || 0;
            }
        }

        newItems[index].subtotal = newItems[index].quantity * newItems[index].unit_price;
        setBillItems(newItems);
    };

    const totalAmount = billItems.reduce((sum, item) => sum + item.subtotal, 0);

    const handleGenerateBill = async () => {
        if (!selectedPatient) return alert("Please select a patient");
        if (billItems.length === 0) return alert("Please add at least one item");

        setLoading(true);
        try {
            // Prepare items for JSON storage (Snapshot of current prices/names)
            const jsonItems = billItems.map(item => {
                const med = medicines.find(m => m.id === item.medicine_id);
                return {
                    name: med?.medicine_name || 'Unknown',
                    qty: item.quantity,
                    quantity: item.quantity, // Save both for compatibility
                    price: item.unit_price,
                    total: item.subtotal
                };
            });

            // 1. Create Bill
            const { data: bill, error: billErr } = await supabase
                .from('bills')
                .insert([{
                    patient_id: selectedPatient.id,
                    total_amount: totalAmount,
                    status: 'paid',
                    items: jsonItems, // Save items directly to JSON column
                }])
                .select()
                .single();

            if (billErr) throw billErr;

            // 2. Update Stock & Try Legacy Table
            for (const item of billItems) {
                const med = medicines.find(m => m.id === item.medicine_id);

                // Update stock
                if (med) {
                    await supabase.from('medicines').update({
                        stock_quantity: med.stock_quantity - item.quantity
                    }).eq('id', med.id);
                }

                // Optional: Try inserting into bill_items if table exists (ignore error if not)
                try {
                    await supabase.from('bill_items').insert([{
                        bill_id: bill.id,
                        item_name: med?.medicine_name,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        subtotal: item.subtotal
                    }]);
                } catch (e) {
                    // Ignore bill_items error as we relying on bills.items JSON now
                }
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setBillItems([]);
                setSelectedPatient(null);
                fetchData(); // Refresh stock
            }, 3000);

        } catch (error) {
            console.error(error);
            alert("Error generating bill: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        (p.full_name || p.name || "").toLowerCase().includes(searchPatient.toLowerCase()) ||
        p.phone?.includes(searchPatient)
    );

    return (
        <Layout title="Billing System">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Patient Selection */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <User className="text-blue-500" /> Select Patient
                        </h3>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchPatient}
                                onChange={e => setSearchPatient(e.target.value)}
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {filteredPatients.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPatient(p)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedPatient?.id === p.id
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'hover:bg-gray-50 border-transparent'
                                        }`}
                                >
                                    <p className="font-bold text-gray-800">{p.full_name}</p>
                                    <p className="text-xs text-gray-500">{p.phone} • {p.age} yrs</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedPatient && (
                        <>
                            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-500/20">
                                <p className="text-xs uppercase font-bold opacity-60 tracking-widest mb-1">Selected Patient</p>
                                <h4 className="text-2xl font-black">{selectedPatient.full_name}</h4>
                                <p className="opacity-80">{selectedPatient.phone}</p>
                            </div>

                            {/* Recent Prescriptions */}
                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                    <CheckCircle size={18} /> Recent Prescriptions
                                </h4>
                                {recentPrescriptions.length === 0 ? (
                                    <p className="text-sm text-emerald-600 opacity-60 italic">No recent prescriptions found.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentPrescriptions.map(presc => (
                                            <div key={presc.id} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-400">{new Date(presc.created_at).toLocaleDateString()}</p>
                                                        {presc.notes && <p className="text-xs text-gray-500 italic max-w-[150px] truncate">"{presc.notes}"</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => loadPrescriptionToBill(presc)}
                                                        className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold hover:bg-emerald-200 transition-colors"
                                                    >
                                                        Load All
                                                    </button>
                                                </div>
                                                <div className="space-y-1">
                                                    {presc.prescription_items?.map(item => (
                                                        <div key={item.id} className="flex justify-between text-xs text-gray-600">
                                                            <span>• {item.medicines?.medicine_name}</span>
                                                            <span className="font-medium">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Items and Calculation */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <Pill className="text-emerald-500" /> Bill Items
                            </h3>
                            <button
                                onClick={addItem}
                                className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-all"
                            >
                                <Plus size={18} /> Add Medicine
                            </button>
                        </div>

                        <div className="flex-1 space-y-4">
                            {billItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                                    <Pill size={48} className="mb-4 opacity-20" />
                                    <p>No medicines added to bill yet.</p>
                                </div>
                            ) : (
                                billItems.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="col-span-12 md:col-span-5">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Medicine</label>
                                            <select
                                                className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none"
                                                value={item.medicine_id}
                                                onChange={e => updateItem(index, 'medicine_id', e.target.value)}
                                            >
                                                <option value="">Select Item</option>
                                                {medicines.map(m => (
                                                    <option key={m.id} value={m.id}>{m.medicine_name} (₹{m.price})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Qty</label>
                                            <input
                                                type="number" min="1"
                                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-center"
                                                value={item.quantity}
                                                onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-3">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subtotal</label>
                                            <p className="p-2 font-bold text-gray-700">₹{item.subtotal.toLocaleString()}</p>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 text-right">
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total Payable</p>
                                    <p className="text-4xl font-black text-gray-900">₹{totalAmount.toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={handleGenerateBill}
                                    disabled={loading || billItems.length === 0}
                                    className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    <Printer size={20} />
                                    {loading ? "Processing..." : "Generate & Print Bill"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {success && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-600/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center text-white">
                        <CheckCircle size={80} className="mx-auto mb-4" />
                        <h2 className="text-5xl font-black mb-2">BILL GENERATED!</h2>
                        <p className="text-xl opacity-80">Inventory updated and receipt ready.</p>
                    </div>
                </div>
            )}
        </Layout>
    );
}
