import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Users, Trash2, Camera, UserCheck, Eye, Phone, MapPin, Calendar, X, Shield, Edit2, ArrowRight, Loader, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import * as faceapi from 'face-api.js';

export default function WorkersList() {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [editingWorker, setEditingWorker] = useState(null);

    // Face Registration State
    const [registeringWorker, setRegisteringWorker] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        setLoading(true);
        const { data } = await supabase.from('workers').select('*').order('name');
        if (data) setWorkers(data);
        setLoading(false);
    };

    const deleteWorker = async (id) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;
        await supabase.from('workers').delete().eq('id', id);
        fetchWorkers();
    };

    const handleUpdate = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('workers').update({
            name: editingWorker.name,
            role: editingWorker.role,
            per_day_salary: editingWorker.per_day_salary,
            phone: editingWorker.phone,
            address: editingWorker.address
        }).eq('id', editingWorker.id);

        if (!error) {
            setEditingWorker(null);
            fetchWorkers();
        } else {
            alert("Error updating: " + error.message);
        }
        setLoading(false);
    };

    // --- Face Registration Logic ---
    const startRegistration = async (worker) => {
        setRegisteringWorker(worker);
        setIsCameraOpen(true);
        setIsModelLoading(true);

        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            setIsModelLoading(false);
            setTimeout(startVideo, 100); // Small delay to ensure modal DOM is ready
        } catch (err) {
            console.error(err);
            alert("Failed to load face models. Check your connection.");
            setIsCameraOpen(false);
        }
    };

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => console.error("Camera Error:", err));
    };

    const closeCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
        setRegisteringWorker(null);
    };

    const captureAndSave = async () => {
        if (!videoRef.current) return;

        try {
            // Detect face
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                // Save descriptor to Supabase
                const descriptorArray = Array.from(detection.descriptor);

                const { error } = await supabase.from('workers')
                    .update({ face_descriptor: descriptorArray })
                    .eq('id', registeringWorker.id);

                if (error) {
                    if (error.code === '42703' || (error.message && error.message.includes('face_descriptor'))) {
                        throw new Error("Missing 'face_descriptor' column in database. Run SQL from FACE_RECOGNITION_SETUP.md");
                    }
                    throw error;
                }

                alert(`Face Registered Successfully for ${registeringWorker.name}!`);
                closeCamera();
                fetchWorkers(); // Refresh to update UI if needed
            } else {
                alert("No face detected. Please look directly at the camera and try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Registration Failed: " + (err.message || "Unknown Error. Check Console."));
        }
    };

    return (
        <Layout title="Workers List">
            <div className="py-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                            <Users className="text-slate-500" /> Support Staff Directory
                        </h2>
                        <p className="opacity-60 text-sm mt-1 text-gray-600 dark:text-gray-400">Manage watchmen, cleaners, and other support staff</p>
                    </div>
                    <Link
                        to="/admin/accounts"
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/20"
                    >
                        Create New Worker
                        <ArrowRight size={18} />
                    </Link>
                </div>


                <div className="glass-card rounded-3xl overflow-x-auto shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="p-6 font-bold uppercase text-xs opacity-60 text-gray-500 dark:text-gray-400">Worker Name & Contact</th>
                                <th className="p-6 font-bold uppercase text-xs opacity-60 text-gray-500 dark:text-gray-400">Role</th>
                                <th className="p-6 font-bold uppercase text-xs opacity-60 text-gray-500 dark:text-gray-400">Daily Salary</th>
                                <th className="p-6 font-bold uppercase text-xs opacity-60 text-gray-500 dark:text-gray-400">Face Status</th>
                                <th className="p-6 font-bold uppercase text-xs opacity-60 text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center opacity-50 italic text-gray-500">Loading workers...</td></tr>
                            ) : workers.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center opacity-50 italic text-gray-500">No workers found. Create one in Accounts.</td></tr>
                            ) : workers.map(w => (
                                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-6">
                                        <button
                                            onClick={() => setSelectedWorker(w)}
                                            className="text-left hover:text-blue-400 transition-colors group flex items-start gap-3 w-full"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                                <Eye size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg leading-tight text-gray-900 dark:text-white">{w.name}</div>
                                                <div className="text-xs text-gray-500 font-medium">{w.phone || 'No Phone'}</div>
                                            </div>
                                        </button>
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                                            {w.role}
                                        </span>
                                    </td>
                                    <td className="p-6 text-gray-600 dark:text-gray-300 font-bold">₹{w.per_day_salary} / day</td>
                                    <td className="p-6">
                                        {w.face_descriptor ? (
                                            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold text-sm">
                                                <ShieldCheck size={16} /> Registered
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-sm opacity-50">
                                                <X size={16} /> Not Registered
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex gap-2">
                                            <button
                                                title="View Full Profile"
                                                onClick={() => setSelectedWorker(w)}
                                                className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <Users size={18} />
                                            </button>

                                            <button
                                                title="Register Face (Browser)"
                                                onClick={() => startRegistration(w)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                                            >
                                                <Camera size={18} />
                                                <span className="text-xs font-bold uppercase tracking-wider hidden xl:inline">Register</span>
                                            </button>
                                            <button
                                                onClick={() => setEditingWorker(w)}
                                                className="p-2 bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-500 hover:text-white transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteWorker(w.id)}
                                                className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Face Registration Modal */}
            {isCameraOpen && registeringWorker && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/90 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="glass-card w-full max-w-lg rounded-[2rem] border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden relative flex flex-col items-center p-6 space-y-4 bg-white dark:bg-gray-900">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white text-center">Register Face</h3>
                        <p className="text-gray-500 dark:text-white/60 text-center -mt-2">for {registeringWorker.name}</p>

                        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-inner">
                            {isModelLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
                                    <Loader className="animate-spin text-blue-500 mb-2" size={32} />
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-50 text-white">Loading AI Models...</p>
                                </div>
                            )}
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                onPlay={() => { }} // Can add detection loop here for visual box if needed
                                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                            />
                            {/* Face Guide Overlay */}
                            {!isModelLoading && (
                                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-2xl pointer-events-none flex items-center justify-center">
                                    <div className="w-48 h-64 border-2 border-white/50 rounded-[50%] animate-pulse"></div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={captureAndSave}
                                disabled={isModelLoading}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                                Capture & Save
                            </button>
                            <button
                                onClick={closeCamera}
                                className="px-6 py-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest opacity-40 text-gray-500 dark:text-gray-400">Ensure good lighting. Look straight ahead.</p>
                    </div>
                </div>
            )}

            {selectedWorker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="glass-card w-full max-w-lg rounded-[3rem] border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden relative bg-white dark:bg-gray-900">
                        {/* Header Decoration */}
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                            <button
                                onClick={() => setSelectedWorker(null)}
                                className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Profile Content */}
                        <div className="px-8 pb-10 -mt-12">
                            <div className="relative inline-block mb-6">
                                <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 border-4 border-white dark:border-white/10 flex items-center justify-center shadow-2xl">
                                    <Users size={40} className="text-blue-500 dark:text-blue-400" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl shadow-lg border-2 border-white dark:border-slate-900">
                                    <Shield size={16} className="text-white" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{selectedWorker.name}</h3>
                                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                                        {selectedWorker.role}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] font-black opacity-30 uppercase mb-2 tracking-widest text-gray-500 dark:text-gray-400">Contact Info</p>
                                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                            <Phone size={16} className="text-blue-500 dark:text-blue-400" />
                                            <span className="font-bold">{selectedWorker.phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] font-black opacity-30 uppercase mb-2 tracking-widest text-gray-500 dark:text-gray-400">System ID</p>
                                        <div className="font-mono text-[10px] opacity-60 truncate text-gray-600 dark:text-gray-400">
                                            {selectedWorker.id}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-3xl border border-gray-100 dark:border-white/5">
                                    <p className="text-[10px] font-black opacity-30 uppercase mb-3 tracking-widest text-gray-500 dark:text-gray-400">Home Address</p>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-blue-100 dark:bg-blue-500/10 p-2 rounded-xl">
                                            <MapPin size={18} className="text-blue-500 dark:text-blue-400" />
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                            {selectedWorker.address || 'No address provided in the system.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/[0.02] rounded-3xl border border-gray-200 dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={18} className="text-indigo-500 dark:text-indigo-400" />
                                        <div>
                                            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-gray-500 dark:text-gray-400">Joining Date</p>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {selectedWorker.join_date ? new Date(selectedWorker.join_date).toLocaleDateString() : 'Dec 2025'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-gray-500 dark:text-gray-400">Daily Rate</p>
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{selectedWorker.per_day_salary}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedWorker(null)}
                                className="w-full mt-8 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-2xl font-black transition-all border border-gray-200 dark:border-white/10 active:scale-95"
                            >
                                CLOSE PROFILE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingWorker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white dark:bg-gray-900">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Worker</h3>
                            <button onClick={() => setEditingWorker(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-500 dark:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-600 dark:text-gray-400">Name</label>
                                <input
                                    required
                                    className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-gray-900 dark:text-white"
                                    value={editingWorker.name}
                                    onChange={e => setEditingWorker({ ...editingWorker, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-600 dark:text-gray-400">Role</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-gray-900 dark:text-white"
                                        style={{ colorScheme: 'dark' }}
                                        value={editingWorker.role}
                                        onChange={e => setEditingWorker({ ...editingWorker, role: e.target.value })}
                                    >
                                        <option value="Watchman">Watchman</option>
                                        <option value="Cleaner">Cleaner</option>
                                        <option value="Security">Security</option>
                                        <option value="Pharmacy Assistant">Pharmacy Assistant</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-600 dark:text-gray-400">Daily Salary (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-gray-900 dark:text-white"
                                        value={editingWorker.per_day_salary}
                                        onChange={e => setEditingWorker({ ...editingWorker, per_day_salary: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-600 dark:text-gray-400">Phone Number</label>
                                <input
                                    className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 text-gray-900 dark:text-white"
                                    value={editingWorker.phone || ''}
                                    onChange={e => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold opacity-50 uppercase mb-1 text-gray-600 dark:text-gray-400">Address</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 h-20 text-gray-900 dark:text-white"
                                    value={editingWorker.address || ''}
                                    onChange={e => setEditingWorker({ ...editingWorker, address: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setEditingWorker(null)} className="flex-1 p-4 rounded-2xl font-black border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400">Cancel</button>
                                <button type="submit" className="flex-1 p-4 rounded-2xl font-black bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm uppercase tracking-widest">Update Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
