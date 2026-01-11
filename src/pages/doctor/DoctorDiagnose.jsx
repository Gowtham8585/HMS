import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Mic, Plus, Save, FileText, Pill } from "lucide-react";

export default function DoctorDiagnose() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState(null);
    const [medicines, setMedicines] = useState([]);
    const [symptoms, setSymptoms] = useState("");
    const [prescriptionNotes, setPrescriptionNotes] = useState("");
    const [prescriptions, setPrescriptions] = useState([{ medicine_id: "", quantity: 1 }]);
    const [loading, setLoading] = useState(false);
    const [listeningField, setListeningField] = useState(null); // 'diagnosis' or 'notes'
    const recognitionRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data: appData } = await supabase.from('appointments').select('*, patients(*)').eq('id', id).single();
            if (appData) setAppointment(appData);

            const { data: medData } = await supabase.from('medicines').select('*').gt('stock_quantity', 0);
            if (medData) setMedicines(medData);
        };
        fetchData();
    }, [id]);

    const addMedicineRow = () => {
        setPrescriptions([...prescriptions, { medicine_id: "", quantity: 1 }]);
    };

    const updatePrescription = (index, field, value) => {
        const newP = [...prescriptions];
        newP[index][field] = value;
        setPrescriptions(newP);
    };

    const startListening = (field, setField) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice Input Not Supported.\n\nThis feature typically works best in Google Chrome or Microsoft Edge.");
            return;
        }

        // Toggle: If already listening to THIS field, stop it.
        if (listeningField === field && recognitionRef.current) {
            recognitionRef.current.stop();
            return; // onend will handle cleanup
        }

        // If listening to ANOTHER field, stop that first
        if (listeningField && recognitionRef.current) {
            recognitionRef.current.stop();
        }

        try {
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            recognition.lang = 'en-US';
            recognition.continuous = true; // Keep listening until stopped
            recognition.interimResults = true; // Show results as they speak

            setListeningField(field);

            recognition.onstart = () => {
                console.log(`Listening started for ${field}...`);
            };

            recognition.onend = () => {
                console.log("Listening ended");
                setListeningField(null);
            };

            let finalTranscriptHeader = ""; // To store what was already there before this session? 
            // Actually, simplest is to append to existing text via state updater, but reacting to every interim result is tricky.
            // Better: 
            // 1. Capture the initial value of the field.
            // 2. On result, NewValue = InitialValue + " " + CurrentTranscript.
            // But we can't easily access InitialValue inside the callback without refs.

            // ALTERNATIVE: Just handle `isFinal` results and append them?
            // If `interimResults` is true, we get a stream.
            // Let's stick to `continuous = false` but restart it? No, that cuts off words.
            // Let's stick to `continuous = true`.

            // To make it simple and robust:
            // We will NOT use interimResults for now to avoid text flickering issues in the textarea, 
            // UNLESS we are fancy. Let's just use continuous=true, interim=false.
            // This way, every time they pause, we get a 'final' chunk, and we append it.

            recognition.continuous = true;
            recognition.interimResults = false;

            recognition.onresult = (event) => {
                let newContent = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        newContent += event.results[i][0].transcript + " ";
                    }
                }

                if (newContent) {
                    setField(prev => (prev ? prev + " " + newContent : newContent).trim());
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                if (event.error === 'not-allowed') {
                    setListeningField(null);
                    alert("Microphone Access Denied.");
                } else if (event.error === 'network') {
                    setListeningField(null);
                    alert("Network Error during voice input.");
                } else if (event.error === 'no-speech') {
                    // Ignore, just keep listening or let it stop
                } else {
                    // Other errors
                    setListeningField(null);
                }
            };

            recognition.start();

        } catch (e) {
            console.error("Speech setup error:", e);
            setListeningField(null);
            alert("Could not start voice input.");
        }
    };


    const handleFinish = async () => {
        setLoading(true);

        try {
            // 1. Update medical history with rich details
            if (appointment) {
                const medList = prescriptions
                    .map(p => {
                        const m = medicines.find(med => med.id === p.medicine_id);
                        return m ? `  - ${m.medicine_name} (Qty: ${p.quantity})` : null;
                    })
                    .filter(Boolean)
                    .join("\n");

                const fullEntry = `
[Date: ${new Date().toLocaleDateString()}]
Symptoms: ${symptoms || "N/A"}
Stats: BP/Weight checked.

Prescription Instructions:
${prescriptionNotes || "None"}

Medicines Given:
${medList || "None"}
------------------------------------------------`;

                const currentHistory = appointment.patients.medical_history || "";
                const newHistory = currentHistory ? `${currentHistory}\n${fullEntry}` : fullEntry;

                await supabase.from('patients').update({ medical_history: newHistory }).eq('id', appointment.patient_id);
            }

            // 1.5 Create structured Prescription Record
            const { data: prescData, error: prescError } = await supabase.from('prescriptions').insert({
                doctor_id: appointment.doctor_id || (await supabase.auth.getUser()).data.user?.id,
                patient_id: appointment.patient_id,
                appointment_id: id,
                notes: prescriptionNotes
            }).select().single();

            if (!prescError && prescData) {
                const itemsToInsert = prescriptions
                    .filter(p => p.medicine_id)
                    .map(p => ({
                        prescription_id: prescData.id,
                        medicine_id: p.medicine_id,
                        quantity: p.quantity,
                        instructions: "As directed"
                    }));

                if (itemsToInsert.length > 0) {
                    await supabase.from('prescription_items').insert(itemsToInsert);
                }
            }

            // 2. Reduce stock & record usage
            for (const p of prescriptions) {
                if (p.medicine_id) {
                    await supabase.from('medicine_usage').insert({
                        patient_id: appointment.patient_id,
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

            // 3. Mark appointment complete
            await supabase.from('appointments').update({ status: 'completed' }).eq('id', id);

            alert("✔ Consultation Finished & Saved!");
            navigate("/doctor");
        } catch (e) {
            console.error(e);
            alert("Error saving data: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!appointment) return (
        <Layout title="Patient Consultation">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        </Layout>
    );

    const inputClasses = "w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-lg focus:border-blue-500 outline-none transition-all resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20";
    const labelClasses = "flex flex-wrap justify-between items-center gap-2 text-xl font-bold text-gray-800 dark:text-white mb-3";

    return (
        <Layout title="Patient Consultation">
            {/* Patient Info Card */}
            <div className="glass-card bg-white dark:bg-white/5 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-white/10 mb-8">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{appointment.patients.name}</h2>
                <div className="flex flex-wrap gap-4 text-lg text-gray-600 dark:text-gray-300 font-medium mb-6">
                    <span className="px-4 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full">Age: {appointment.patients.age}</span>
                    <span className="px-4 py-1 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded-full">Gender: {appointment.patients.gender}</span>
                </div>

                <div className="p-6 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl border border-yellow-200 dark:border-yellow-500/20">
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center gap-2">
                        <FileText size={20} /> Previous Medical History
                    </h4>
                    <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans text-sm max-h-40 overflow-y-auto">
                        {appointment.patients.medical_history || "No previous history recorded."}
                    </pre>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Symptoms Section */}
                <div className="glass-card bg-white dark:bg-white/5 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-white/10">
                    <div className={labelClasses}>
                        <span>Patient Symptoms</span>
                        <button
                            type="button"
                            onClick={() => startListening('symptoms', setSymptoms)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${listeningField === 'symptoms' ? 'bg-red-500 text-white animate-pulse' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/20'}`}
                        >
                            <Mic size={18} />
                            {listeningField === 'symptoms' ? "Listening..." : "Voice Input"}
                        </button>
                    </div>
                    <textarea
                        className={`${inputClasses} h-64`}
                        placeholder="Record patient's reported symptoms..."
                        value={symptoms}
                        onChange={e => setSymptoms(e.target.value)}
                    />
                </div>

                {/* Instructions Section */}
                <div className="glass-card bg-white dark:bg-white/5 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-white/10">
                    <div className={labelClasses}>
                        <span>Prescription Instructions</span>
                        <button
                            type="button"
                            onClick={() => startListening('notes', setPrescriptionNotes)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${listeningField === 'notes' ? 'bg-red-500 text-white animate-pulse' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/20'}`}
                        >
                            <Mic size={18} />
                            {listeningField === 'notes' ? "Listening..." : "Voice Input"}
                        </button>
                    </div>
                    <textarea
                        className={`${inputClasses} h-64`}
                        placeholder="e.g. Take 1 tablet after meals twice daily..."
                        value={prescriptionNotes}
                        onChange={e => setPrescriptionNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* Medicines Section */}
            <div className="glass-card bg-white dark:bg-white/5 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-white/10 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Pill className="text-emerald-500" />
                        Prescribe Inventory Medicines
                    </h3>
                    <button onClick={addMedicineRow} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <Plus size={20} /> Add Medicine
                    </button>
                </div>

                <div className="space-y-4">
                    {prescriptions.map((row, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="flex-1 w-full sm:w-auto">
                                <select
                                    className="w-full p-4 border border-gray-200 dark:border-white/10 rounded-xl text-lg bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                                    style={{ colorScheme: 'light dark' }}
                                    value={row.medicine_id}
                                    onChange={e => updatePrescription(i, 'medicine_id', e.target.value)}
                                >
                                    <option value="">Select Medicine from Stock...</option>
                                    {medicines.map(m => (
                                        <option key={m.id} value={m.id}>{m.medicine_name} ({m.medicine_type}) • Stock: {m.stock_quantity}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full sm:w-32 flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">Qty:</span>
                                <input
                                    type="number" min="1"
                                    className="w-full p-4 border border-gray-200 dark:border-white/10 rounded-xl text-lg text-center bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                    value={row.quantity}
                                    onChange={e => updatePrescription(i, 'quantity', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={handleFinish}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black py-6 rounded-2xl text-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>Processing...</>
                ) : (
                    <>
                        <Save size={28} />
                        COMPLETE CONSULTATION
                    </>
                )}
            </button>
        </Layout>
    );
}
