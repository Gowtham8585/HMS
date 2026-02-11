import Layout from "../../components/Layout";
import { Camera, CheckCircle, AlertTriangle, Loader, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import * as faceapi from 'face-api.js';

export default function WorkerAttendance() {
    const [status, setStatus] = useState("idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [detectedName, setDetectedName] = useState("");
    const [loadedCount, setLoadedCount] = useState(0);
    const [debugInfo, setDebugInfo] = useState("");

    // Refs for Loop Access (prevents stale closure issues)
    const faceMatcherRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        return () => stopScanning();
    }, []);

    const startSystem = async () => {
        try {
            setStatus("initializing");
            setStatusMessage("Starting Camera...");

            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setStatusMessage("Loading AI Models...");
            await loadModelsAndData();

        } catch (err) {
            console.error(err);
            setStatus("error");
            setStatusMessage("Startup Error: " + (err.message || "Check Camera Permissions"));
        }
    };

    const loadModelsAndData = async () => {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);

            setStatusMessage("Fetching Database...");
            const { data: workers, error } = await supabase
                .from('workers')
                .select('id, name, face_descriptor')
                .not('face_descriptor', 'is', null);

            if (error) throw new Error("DB Error: " + error.message);

            console.log("Loaded Workers:", workers);
            setLoadedCount(workers ? workers.length : 0);

            if (workers && workers.length > 0) {
                const labeledDescriptors = workers.map(w => {
                    const descriptor = new Float32Array(w.face_descriptor);
                    return new faceapi.LabeledFaceDescriptors(JSON.stringify({ id: w.id, name: w.name }), [descriptor]);
                });

                // create matcher
                const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);

                // Update REF for the loop to see immediately
                faceMatcherRef.current = matcher;

                setStatus("scanning");
                setStatusMessage("Looking for faces...");
            } else {
                faceMatcherRef.current = null;
                setStatus("scanning");
                setStatusMessage("No Registered Faces Found.");
                setDebugInfo("ACTION REQUIRED: Register workers in 'Workers List' first.");
            }

            startDetectionLoop();

        } catch (err) {
            console.error(err);
            setStatus("error");
            setStatusMessage("System Error: " + err.message);
        }
    };

    const startDetectionLoop = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        const runDetection = async () => {
            if (status === 'error' || status === 'idle' || !canvasRef.current || !videoRef.current) return;
            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
            faceapi.matchDimensions(canvasRef.current, displaySize);

            try {
                const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });

                const detection = await faceapi.detectSingleFace(video, options)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                if (detection) {
                    const resizedDetections = faceapi.resizeResults(detection, displaySize);
                    const box = resizedDetections.detection.box;

                    // Use REF here to get the latest matcher
                    const matcher = faceMatcherRef.current;

                    if (matcher) {
                        const match = matcher.findBestMatch(detection.descriptor);

                        if (match.label !== "unknown") {
                            // --- MATCH FOUND ---
                            const userData = JSON.parse(match.label);
                            setDebugInfo(`Verified: ${userData.name} (${Math.round(match.distance * 100) / 100})`);

                            // Green Box
                            new faceapi.draw.DrawBox(box, { label: userData.name, boxColor: '#10b981' }).draw(canvasRef.current);

                            handleMatchFound(userData);
                        } else {
                            // --- UNKNOWN FACE ---
                            setDebugInfo("User Not Found");

                            // Red Box
                            new faceapi.draw.DrawBox(box, { label: "User Not Found", boxColor: '#ef4444' }).draw(canvasRef.current);
                        }
                    } else {
                        // --- NO DB LOADED ---
                        setDebugInfo("System Empty - Please Register Faces");

                        // Blue Box
                        new faceapi.draw.DrawBox(box, { label: "No Database", boxColor: '#3b82f6' }).draw(canvasRef.current);
                    }
                } else {
                    if (statusMessage === "Looking for faces...") {
                        setDebugInfo("Scanning...");
                    }
                }
            } catch (err) {
                // setDebugInfo("DetErr: " + err.message);
            }
        };

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(runDetection, 100);
    };

    const handleMatchFound = async (userData) => {
        // Prevent multiple triggers
        if (status === 'processing' || status === 'success') return;

        clearInterval(intervalRef.current);
        setStatus("processing");
        setStatusMessage(`Marking Attendance: ${userData.name}...`);
        setDetectedName(userData.name);

        try {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const nowISO = now.toISOString();

            const { data: records } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', userData.id)
                .eq('date', today);

            let msg = "";

            if (records && records.length > 0) {
                const record = records[0];
                if (!record.check_out) {
                    const { error: updateError } = await supabase.from('attendance').update({
                        check_out: nowISO,
                        status: 'present'
                    }).eq('id', record.id);

                    if (updateError) throw updateError;

                    msg = `Goodbye, ${userData.name}! (Checked Out)`;
                } else {
                    msg = `Already Checked Out today!`;
                }
            } else {
                const { error: insertError } = await supabase.from('attendance').insert({
                    user_id: userData.id,
                    date: today,
                    check_in: nowISO,
                    status: 'present'
                });

                if (insertError) throw insertError;

                msg = `Welcome, ${userData.name}! (Checked In)`;
            }

            setStatus("success");
            setStatusMessage(msg);

            // 3s delay then close camera (Auto Close)
            setTimeout(() => {
                stopScanning();
            }, 3000);

        } catch (err) {
            console.error(err);
            setStatus("error");
            setStatusMessage("Save Failed: " + err.message);
            // On error, let them try again after delay
            setTimeout(() => { setStatus("scanning"); startDetectionLoop(); }, 4000);
        }
    };

    const stopScanning = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setStatus("idle");
        setStatusMessage("");
        setDebugInfo("");
    };

    return (
        <Layout title="Worker Attendance System">
            <div className="max-w-4xl mx-auto py-6">
                <div className="glass-card p-6 rounded-[3rem] border border-gray-200 dark:border-white/10 shadow-2xl text-center space-y-6 relative overflow-hidden bg-white dark:bg-black/40">

                    {/* Status Header */}
                    <div className="z-10 relative">
                        <h2 className="text-3xl font-black mb-2 flex justify-center items-center gap-3 text-gray-900 dark:text-white">
                            {(status === 'initializing' || status === 'loading_models' || status === 'processing') && <Loader className="animate-spin text-blue-500" />}
                            {status === 'scanning' && <Camera className="text-blue-500 animate-pulse" />}
                            {status === 'success' && <CheckCircle className="text-emerald-500" />}
                            {status === 'error' && <AlertTriangle className="text-red-500" />}

                            {status === 'idle' ? "Ready to Start" :
                                status === 'initializing' ? "Starting Camera..." :
                                    status === 'loading_models' ? "Loading AI..." :
                                        status === 'scanning' ? "Scanning..." :
                                            status === 'success' ? "Attendance Marked" :
                                                status === 'processing' ? "Verifying..." : "System Error"}
                        </h2>
                        <p className={`text-lg font-bold ${status === 'success' ? 'text-emerald-500' :
                            status === 'error' ? 'text-red-500' : 'opacity-60 text-gray-500 dark:text-gray-400'}`}>
                            {statusMessage}
                        </p>

                        {/* Live Debug Text */}
                        {status === 'scanning' && (
                            <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-300 mt-2 h-6">
                                {debugInfo}
                            </p>
                        )}

                        {status === 'scanning' && loadedCount === 0 && (
                            <div className="mt-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-200 text-xs p-2 rounded-lg inline-block border border-yellow-500/40">
                                ⚠ No faces found in DB. Please register workers.
                            </div>
                        )}
                        {status === 'scanning' && loadedCount > 0 && (
                            <p className="text-[10px] uppercase opacity-30 mt-1 text-gray-500 dark:text-white">{loadedCount} faces loaded</p>
                        )}
                    </div>

                    {/* Camera Area */}
                    <div className="relative mx-auto w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden border-4 border-gray-100 dark:border-white/10 shadow-inner group mt-6">
                        {status === 'idle' && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/10 dark:bg-black/50 backdrop-blur-sm">
                                <button
                                    onClick={startSystem}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-3"
                                >
                                    <Camera size={24} />
                                    ACTIVATE CAMERA
                                </button>
                            </div>
                        )}

                        {status !== 'idle' && (
                            <div className="absolute top-4 right-4 z-30">
                                <button
                                    onClick={stopScanning}
                                    className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
                                >
                                    STOP
                                </button>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            onPlay={startDetectionLoop}
                            className={`w-full h-full object-cover transition-opacity duration-500 
                                ${status === 'idle' ? 'opacity-50' : 'opacity-100'}`}
                        />
                        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
