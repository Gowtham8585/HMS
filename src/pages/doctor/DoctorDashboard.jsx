import { useEffect, useState, useRef } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, CheckCircle, Clock, Pill, Plus, Search, X, FileText, Mic, Save } from "lucide-react";

export default function DoctorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expiredCount, setExpiredCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [allPatients, setAllPatients] = useState([]);
    const [allMedicines, setAllMedicines] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [creating, setCreating] = useState(false);

    // Quick Prescribe State
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([{ medicine_id: "", quantity: 1 }]);
    const [prescriptionNotes, setPrescriptionNotes] = useState("");
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        async function checkMedicineExpiry() {
            const { data } = await supabase.from('medicines').select('expiry_date');
            if (data) {
                const count = data.filter(m => m.expiry_date && new Date(m.expiry_date) < new Date()).length;
                setExpiredCount(count);
            }
        }
        checkMedicineExpiry();
    }, []);

    useEffect(() => {
        if (user) fetchAppointments();

        const subscription = supabase
            .channel('appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAppointments())
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    const fetchAppointments = async () => {
        try {
            // First, get the doctor's profile ID
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .eq('role', 'doctor')
                .single();

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                setLoading(false);
                return;
            }

            if (!profileData) {
                console.error('No doctor profile found for user:', user.id);
                setLoading(false);
                return;
            }

            // Fetch all active appointments using the profile ID
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                id,
                appointment_date,
                appointment_time,
                status,
                patients (id, name, age, gender)
            `)
                .eq('doctor_id', profileData.id)
                .in('status', ['scheduled', 'pending']) // Show both scheduled and pending
                .order('appointment_date', { ascending: true }); // Soonest first

            if (error) {
                console.error('Appointments fetch error:', error);
            } else {
                setAppointments(data || []);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const openPrescribeModal = async () => {
        setShowModal(true);
        setSelectedPatient(null);
        setPrescriptions([{ medicine_id: "", quantity: 1 }]);
        setPrescriptionNotes("");

        if (allPatients.length === 0) {
            const { data } = await supabase.from('patients').select('id, name, age, gender').order('name');
            if (data) setAllPatients(data);
        }
        if (allMedicines.length === 0) {
            const { data } = await supabase.from('medicines').select('*').gt('stock_quantity', 0);
            if (data) setAllMedicines(data);
        }
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice support is turned off in this browser.\n\nTo enable it:\n• Firefox: Go to 'about:config' and set 'media.webspeech.recognition.enable' to true.\n• Brave: Allow 'Google Services' in settings.\n• Others: Check your Microphone privacy settings.");
            return;
        }

        if (!navigator.onLine) {
            alert("No Internet Connection. Voice input requires an active internet connection.");
            return;
        }

        try {
            // Stop any previous instance
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {/* ignore */ }
            }

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition; // Store in ref

            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;

            setListening(true);

            recognition.onstart = () => {
                console.log("Listening started");
            };

            recognition.onend = () => {
                console.log("Listening ended");
                setListening(false);
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setPrescriptionNotes(prev => {
                    const newText = prev ? prev + " " + transcript : transcript;
                    return newText;
                });
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setListening(false);
                if (event.error === 'not-allowed') {
                    alert("Microphone access denied. Please allow microphone access.");
                } else if (event.error === 'no-speech') {
                    alert("No speech detected. Please speak clearly and try again.");
                } else if (event.error === 'network') {
                    if (!navigator.onLine) {
                        alert("Network error: You appear to be offline. Please check your connection.");
                    } else {
                        alert("Voice input failed. Your browser or network may be blocking the speech service. Please type manually.");
                    }
                } else {
                    alert("Voice input unavailable (" + event.error + ").");
                }
            };

            recognition.start();
        } catch (e) {
            console.error(e);
            setListening(false);
            alert("Failed to start voice input: " + e.message);
        }
    };

    const addMedicineRow = () => {
        setPrescriptions([...prescriptions, { medicine_id: "", quantity: 1 }]);
    };

    const updatePrescription = (index, field, value) => {
        const newP = [...prescriptions];
        newP[index][field] = value;
        setPrescriptions(newP);
    };

    const savePrescription = async () => {
        setCreating(true);
        try {
            // Get doctor's profile ID first
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .eq('role', 'doctor')
                .single();

            if (profileError || !profileData) {
                throw new Error('Doctor profile not found');
            }

            const doctorProfileId = profileData.id;

            // 1. Update medical history
            const medList = prescriptions
                .map(p => {
                    const m = allMedicines.find(med => med.id === p.medicine_id);
                    return m ? `  - ${m.medicine_name} (Qty: ${p.quantity})` : null;
                })
                .filter(Boolean)
                .join("\n");

            const fullEntry = `
[Quick Prescription: ${new Date().toLocaleDateString()}]
Notes: ${prescriptionNotes || "None"}
Medicines:
${medList || "None"}
------------------------------------------------`;

            if (selectedPatient.id) {
                const { data: pData } = await supabase.from('patients').select('medical_history').eq('id', selectedPatient.id).single();
                const currentHistory = pData?.medical_history || "";
                await supabase.from('patients').update({ medical_history: currentHistory + "\n" + fullEntry }).eq('id', selectedPatient.id);
            }

            // 2. Reduce stock & record usage
            for (const p of prescriptions) {
                if (p.medicine_id) {
                    await supabase.from('medicine_usage').insert({
                        patient_id: selectedPatient.id,
                        medicine_id: p.medicine_id,
                        quantity_used: p.quantity,
                        date: new Date().toISOString()
                    });

                    const { data: med } = await supabase.from('medicines').select('stock_quantity').eq('id', p.medicine_id).single();
                    if (med) {
                        await supabase.from('medicines').update({ stock_quantity: med.stock_quantity - p.quantity }).eq('id', p.medicine_id);
                    }
                }
            }

            // 3. Create completed appointment record
            const { data: appt, error: apptError } = await supabase.from('appointments').insert({
                doctor_id: doctorProfileId,
                patient_id: selectedPatient.id,
                status: 'completed',
                appointment_date: new Date().toISOString()
            }).select().single();

            if (apptError) throw apptError;

            // 4. Create structured Prescription Record (New DB Table - User Request)
            const { data: prescData, error: prescError } = await supabase.from('prescriptions').insert({
                doctor_id: doctorProfileId,
                patient_id: selectedPatient.id,
                appointment_id: appt.id,
                notes: prescriptionNotes
            }).select().single();

            if (prescError) throw prescError;

            if (prescData) {
                const itemsToInsert = prescriptions
                    .filter(p => p.medicine_id)
                    .map(p => ({
                        prescription_id: prescData.id,
                        medicine_id: p.medicine_id,
                        quantity: p.quantity,
                        instructions: "As directed" // Default for now
                    }));

                if (itemsToInsert.length > 0) {
                    await supabase.from('prescription_items').insert(itemsToInsert);
                }
            }

            await fetchAppointments(); // Refresh dashboard

            alert("Prescription Saved!");
            setShowModal(false);
        } catch (error) {
            console.error(error);
            alert("Failed to save prescription: " + error.message);
        } finally {
            setCreating(false);
        }
    };

    const filteredPatients = allPatients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout title="Doctor Dashboard">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                <h2 className="text-3xl font-black opacity-90 flex items-center gap-3 text-gray-900 dark:text-white">
                    <Calendar className="text-blue-600 dark:text-blue-500" size={32} />
                    Scheduled Appointments
                </h2>
                <div className="flex flex-wrap gap-4">
                    <Link to="/admin/medicines" className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg shadow-rose-500/20 active:scale-95 transition-all relative">
                        <Pill size={20} />
                        Medicine Stock
                        {expiredCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-slate-900 group-hover:scale-110 transition-transform">
                                <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-75"></span>
                            </span>
                        )}
                    </Link>
                    <Link to="/attendance" className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg shadow-green-500/20 active:scale-95 transition-all">
                        <Clock size={20} />
                        Mark Attendance
                    </Link>
                    <button onClick={openPrescribeModal} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                        <FileText size={20} />
                        Quick Prescribe
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-center py-10 text-xl text-gray-500 dark:text-gray-400">Loading appointments...</p>
            ) : appointments.length === 0 ? (
                <div className="glass-card bg-white dark:bg-white/5 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                    <Calendar size={64} className="mb-4 text-gray-300 dark:text-white/20" />
                    <p className="text-2xl font-medium">No appointments found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map(app => (
                        <div key={app.id} className="glass-card bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-gray-50 dark:hover:bg-white/10">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${app.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                                    {app.status === 'completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{app.patients?.name || "Unknown Patient"}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                                        {app.patients?.age} yrs • {app.patients?.gender}
                                        <span className="mx-2 text-gray-300">|</span>
                                        {new Date(app.appointment_date).toDateString()}
                                    </p>
                                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${app.status === 'completed' ? 'bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400'
                                        }`}>
                                        {app.status}
                                    </span>
                                </div>
                            </div>
                            {app.status !== 'completed' && (
                                <Link
                                    to={`/doctor/diagnose/${app.id}`}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors w-full sm:w-auto text-center shadow-md active:transform active:scale-95"
                                >
                                    Start Consult
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {/* Patient Selection Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus className="text-blue-600" />
                                {selectedPatient ? "Prescribe Medicines" : "Select Patient"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {!selectedPatient ? (
                            <>
                                <div className="p-6 space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search patients..."
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all font-medium"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-2">
                                    {filteredPatients.length === 0 ? (
                                        <p className="text-center text-gray-500 py-10">No patients found</p>
                                    ) : (
                                        filteredPatients.map(patient => (
                                            <button
                                                key={patient.id}
                                                onClick={() => setSelectedPatient(patient)}
                                                className="w-full p-4 flex items-center justify-between bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-gray-100 dark:border-white/5 rounded-xl transition-all group text-left"
                                            >
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{patient.name}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{patient.age} yrs • {patient.gender}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                    <Plus size={20} />
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                    <h4 className="font-bold text-blue-900 dark:text-blue-300">Prescribing for: {selectedPatient.name}</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-400">{selectedPatient.age} yrs • {selectedPatient.gender}</p>
                                </div>

                                {/* Voice Notes */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-bold text-gray-700 dark:text-gray-300">Instructions / Notes</label>
                                        <button
                                            type="button"
                                            onClick={startListening}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold transition-all ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            <Mic size={14} /> {listening ? "Listening..." : "Voice Input"}
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-500 transition-all text-gray-900 dark:text-white h-24 resize-none"
                                        placeholder="Add instructions..."
                                        value={prescriptionNotes}
                                        onChange={e => setPrescriptionNotes(e.target.value)}
                                    />
                                </div>

                                {/* Medicines */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-900 dark:text-white">Medicines</h4>
                                        <button onClick={addMedicineRow} className="text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors">+ Add</button>
                                    </div>
                                    {prescriptions.map((row, i) => (
                                        <div key={i} className="flex gap-2">
                                            <select
                                                className="flex-1 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white"
                                                value={row.medicine_id}
                                                onChange={e => updatePrescription(i, 'medicine_id', e.target.value)}
                                            >
                                                <option value="">Select Medicine...</option>
                                                {allMedicines.map(m => (
                                                    <option key={m.id} value={m.id}>{m.medicine_name} ({m.stock_quantity})</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number" min="1"
                                                className="w-20 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-center text-gray-900 dark:text-white"
                                                value={row.quantity}
                                                onChange={e => updatePrescription(i, 'quantity', parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={() => setSelectedPatient(null)}
                                        className="flex-1 py-3 font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={savePrescription}
                                        disabled={creating}
                                        className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {creating ? "Saving..." : <><Save size={20} /> Save Prescription</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
}
