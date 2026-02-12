import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import Chatbot from "../../components/Chatbot";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Calendar, Pill, FileText } from "lucide-react";

export default function PatientDashboard() {
    const { user } = useAuth();

    const [patientInfo, setPatientInfo] = useState(null);
    const [hospitalInfo, setHospitalInfo] = useState(null);

    const [appointments, setAppointments] = useState([]);
    const [bills, setBills] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingDoctors, setBookingDoctors] = useState([]);
    const [newBooking, setNewBooking] = useState({ doctor_id: "", appointment_date: new Date().toISOString().slice(0, 16) });
    const [upcomingAlert, setUpcomingAlert] = useState(null);
    const [activeTab, setActiveTab] = useState('appointments');

    const fetchClientData = async (showLoading = true) => {
        if (showLoading) setLoading(true);

        try {
            // 1. Fetch Patient & Hospital Info first
            console.log('Fetching data for User ID:', user.id);
            const [pRes, hRes] = await Promise.all([
                supabase.from('patients').select('*').eq('user_id', user.id).maybeSingle(),
                supabase.from('hospital_settings').select('*').maybeSingle()
            ]);
            console.log('Patient Fetch Result:', pRes);

            if (pRes.data) setPatientInfo(pRes.data);
            if (hRes.data) setHospitalInfo(hRes.data);

            const pid = pRes.data?.id;

            if (pid) {
                // 2. Fetch related records using correct Patient UUID
                const [appRes, billRes, prescRes] = await Promise.all([
                    supabase.from('appointments').select('*, doctors:profiles(full_name, specialization)').eq('patient_id', pid).order('appointment_date', { ascending: false }).limit(5),
                    supabase.from('bills').select('*').eq('patient_id', pid).order('created_at', { ascending: false }).limit(5),
                    supabase.from('prescriptions').select('*, doctors:profiles(full_name), prescription_items(*, medicines(medicine_name))').eq('patient_id', pid).order('created_at', { ascending: false }).limit(10)
                ]);

                if (appRes.data) setAppointments(appRes.data);
                if (billRes.data) setBills(billRes.data);
                if (prescRes.data) setMedicines(prescRes.data);
            }

        } catch (e) {
            console.error("Global Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchClientData();

            // Realtime subscriptions
            const appSub = supabase
                .channel('patient_updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `patient_id=eq.${user.id}` }, (payload) => {
                    console.log("Appointment Update:", payload);
                    fetchClientData(false);
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions', filter: `patient_id=eq.${user.id}` }, (payload) => {
                    console.log("Prescription Update:", payload);
                    fetchClientData(false);
                })
                .subscribe((status) => {
                    console.log("Realtime Status:", status);
                });

            return () => {
                appSub.unsubscribe();
            };
        }
    }, [user]);

    // Check for appointments in next 30 mins
    useEffect(() => {
        if (appointments.length > 0) {
            const now = new Date();
            const upcoming = appointments.find(app => {
                const appDate = new Date(app.appointment_date);
                const diffMs = appDate - now;
                const diffMins = diffMs / 1000 / 60;
                return diffMins > 0 && diffMins <= 30 && app.status !== 'completed';
            });

            if (upcoming) {
                setUpcomingAlert(`🔔 Reminder: You have an appointment with Dr. ${upcoming.doctors?.full_name || 'Doctor'} in ${Math.ceil((new Date(upcoming.appointment_date) - now) / 1000 / 60)} minutes!`);
            } else {
                setUpcomingAlert(null);
            }
        }
    }, [appointments]);

    useEffect(() => {
        if (showBookingModal && bookingDoctors.length === 0) {
            fetchDoctorsForBooking();
        }
    }, [showBookingModal]);

    const fetchDoctorsForBooking = async () => {
        const { data } = await supabase.from('profiles').select('id, full_name, specialization').eq('role', 'doctor');
        if (data) {
            setBookingDoctors(data);
            if (data.length > 0 && !newBooking.doctor_id) {
                setNewBooking(prev => ({ ...prev, doctor_id: data[0].id }));
            }
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dateTime = newBooking.appointment_date;
            const [datePart, timePart] = dateTime.split('T');

            if (!patientInfo?.id) throw new Error("Patient record not found for this account. Please contact reception to link your profile.");

            const { error } = await supabase.from('appointments').insert({
                patient_id: patientInfo.id,
                doctor_id: newBooking.doctor_id,
                appointment_date: datePart,
                appointment_time: timePart,
                status: 'scheduled'
            });

            if (error) throw error;
            alert("Appointment Booked Successfully!");
            setShowBookingModal(false);
            fetchClientData(); // Refresh list
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="My Patient Portal">
            <div className="space-y-8 pt-4">
                {upcomingAlert && (
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl shadow-lg animate-pulse flex items-center gap-3">
                        <span className="text-2xl">⏰</span>
                        <p className="font-bold">{upcomingAlert}</p>
                    </div>
                )}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black opacity-80 text-gray-900 dark:text-white">Hello, {patientInfo?.full_name || 'Patient'}! 👋</h2>
                        <p className="text-sm opacity-50 mt-1 text-gray-400">View your medical records and appointments</p>
                    </div>
                    <button onClick={() => fetchClientData(true)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        Refresh Data ↻
                    </button>
                </div>



                {/* Hospital Info Card */}
                {hospitalInfo && (
                    <div className="glass-card p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-blue-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <h3 className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-300 mb-2">{hospitalInfo.hospital_name || "Hospital Name"}</h3>
                            <div className="flex flex-col md:flex-row gap-6 mt-4 text-gray-600 dark:text-gray-300">
                                <div className="flex items-start gap-2">
                                    <span className="opacity-50">📍</span>
                                    <p className="max-w-xs">{hospitalInfo.address || "Address not available"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="opacity-50">📞</span>
                                    <p className="font-bold">{hospitalInfo.contact_number || "Contact not available"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'appointments'
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                    >
                        📅 Appointments
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'invoices'
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                    >
                        📄 Invoices & Bills
                    </button>
                    <button
                        onClick={() => setActiveTab('medicines')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'medicines'
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                    >
                        💊 Prescribed Medicines
                    </button>
                </div>

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                    <div className="glass-card p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                <Calendar className="text-blue-600 dark:text-blue-500" />
                                My Appointments
                            </h3>
                            <button
                                onClick={() => setShowBookingModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                + Book New
                            </button>
                        </div>

                        {loading ? <p className="opacity-40 italic text-gray-400">Loading...</p> :
                            appointments.length > 0 ? (
                                <div className="space-y-4">
                                    {appointments.map(app => (
                                        <div key={app.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">Dr. {app.doctors?.full_name || "Consultant"}</p>
                                                <p className="text-sm opacity-60 text-gray-500 dark:text-gray-400">
                                                    {new Date(app.appointment_date).toLocaleDateString()} at {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-xs opacity-50 text-gray-500 dark:text-gray-400 mt-1">{app.doctors?.specialization}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${app.status === 'completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="opacity-40 text-gray-500 dark:text-gray-400 mb-4">No upcoming appointments found.</p>
                                    <button
                                        onClick={() => setShowBookingModal(true)}
                                        className="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-xl font-bold hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-all shadow-sm"
                                    >
                                        📅 Book Your First Appointment
                                    </button>
                                </div>
                            )
                        }
                    </div>
                )}

                {/* Bills Tab */}
                {activeTab === 'invoices' && (
                    <div className="glass-card p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 animate-in fade-in zoom-in-95 duration-300">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-900 dark:text-white">
                            <FileText className="text-orange-500" />
                            Recent Invoices
                        </h3>
                        {loading ? <p className="opacity-40 italic text-gray-400">Loading...</p> :
                            bills.length > 0 ? (
                                <div className="space-y-4">
                                    {bills.map(bill => (
                                        <div key={bill.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                            <div>
                                                <p className="font-black text-lg text-gray-900 dark:text-white">₹{bill.total_amount?.toLocaleString()}</p>
                                                <p className="text-xs opacity-60 text-gray-500 dark:text-gray-400">{new Date(bill.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-lg uppercase">
                                                {bill.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="opacity-40 text-gray-500 dark:text-gray-400 p-8 text-center">No recent bills found.</p>
                            )
                        }
                    </div>
                )}

                {/* Medicines Tab */}
                {activeTab === 'medicines' && (
                    <div className="glass-card p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 animate-in fade-in zoom-in-95 duration-300">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-900 dark:text-white">
                            <Pill className="text-emerald-600 dark:text-emerald-500" />
                            Prescribed Medicines
                        </h3>
                        {loading ? <p className="opacity-40 italic text-gray-400">Loading...</p> :
                            medicines.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {medicines.map(group => (
                                        <div key={group.id} className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                                                        Dr. {group.doctors?.full_name || "Consultant"}
                                                    </p>
                                                    <p className="text-xs opacity-60 text-gray-500">{new Date(group.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <span className="bg-white/50 dark:bg-black/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                                                    <Pill size={16} />
                                                </span>
                                            </div>

                                            {group.notes && (
                                                <div className="mb-4 bg-white/50 dark:bg-black/10 p-2 rounded-lg">
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{group.notes}"</p>
                                                </div>
                                            )}

                                            <div className="space-y-2 mt-auto">
                                                {group.prescription_items?.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-emerald-200/50 dark:border-white/5 last:border-0 pb-1 last:pb-0">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">{item.medicines?.medicine_name}</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="opacity-40 text-gray-500 dark:text-gray-400">No active prescriptions shown. Consult your doctor.</p>
                            )
                        }
                    </div>
                )}

                {/* Booking Modal */}
                {showBookingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl relative bg-white dark:bg-gray-900">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Book Appointment</h3>

                            <form onSubmit={handleBookAppointment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold opacity-60 mb-2 uppercase tracking-widest text-gray-500 dark:text-gray-400">Select Doctor</label>
                                    <select
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                        style={{ colorScheme: 'light dark' }}
                                        value={newBooking.doctor_id}
                                        onChange={e => setNewBooking({ ...newBooking, doctor_id: e.target.value })}
                                    >
                                        {bookingDoctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>Dr. {doc.full_name} ({doc.specialization || 'General'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold opacity-60 mb-2 uppercase tracking-widest text-gray-500 dark:text-gray-400">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                        value={newBooking.appointment_date}
                                        onChange={e => setNewBooking({ ...newBooking, appointment_date: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowBookingModal(false)}
                                        className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <Chatbot />
        </Layout>
    );
}
