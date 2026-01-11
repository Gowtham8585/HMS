import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';

export default function VoiceDebug() {
    const [status, setStatus] = useState("Idle");
    const [engineName, setEngineName] = useState("Unknown");
    const [logs, setLogs] = useState([]);
    const recognitionRef = useRef(null);

    const log = (msg) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    const runTest = () => {
        setLogs([]);
        log("Checking browser support...");

        if (!('start' in window)) {
            // Check if window object is weird
            log("Is window object present? " + (!!window));
        }

        const standard = window.SpeechRecognition;
        const webkit = window.webkitSpeechRecognition;
        const moz = window.mozSpeechRecognition;
        const ms = window.msSpeechRecognition;

        log(`Standard: ${!!standard}`);
        log(`Webkit: ${!!webkit}`);
        log(`Moz: ${!!moz}`);
        log(`MS: ${!!ms}`);

        const Engine = standard || webkit || moz || ms;
        if (!Engine) {
            setStatus("Failed: No Engine Found");
            log("No SpeechRecognition API found on window object.");
            return;
        }

        setEngineName(Engine.name || "Anonymous Function");
        log(`Selected Engine: ${Engine.name}`);

        if (!navigator.onLine) {
            log("WARNING: Browser reports offline. Speech API requires internet.");
        }

        try {
            const recognition = new Engine();
            recognitionRef.current = recognition;
            log("Instance created successfully.");

            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setStatus("Listening...");
                log("Event: onstart fired.");
            };

            recognition.onend = () => {
                setStatus("Stopped");
                log("Event: onend fired.");
            };

            recognition.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                log(`RESULT: "${transcript}"`);
                alert(`Success! Heard: "${transcript}"`);
            };

            recognition.onerror = (e) => {
                log(`ERROR Event: ${e.error}`);
                if (e.message) log(`Details: ${e.message}`);
                setStatus("Error: " + e.error);
            };

            log("Attempting to start...");
            recognition.start();
        } catch (e) {
            log(`EXCEPTION: ${e.message}`);
            setStatus("Exception Thrown");
        }
    };

    return (
        <Layout title="Voice Debugger">
            <div className="p-8 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4">Voice Recognition Diagnostics</h2>

                    <div className="flex gap-4 items-center mb-6">
                        <button
                            onClick={runTest}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Run Diagnostics
                        </button>
                        <div className="text-lg font-mono p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            Status: <span className="font-bold">{status}</span>
                        </div>
                    </div>

                    <div className="space-y-2 font-mono text-sm bg-black text-green-400 p-4 rounded-xl h-96 overflow-y-auto">
                        {logs.length === 0 ? <span className="opacity-50">Logs will appear here...</span> : logs.map((l, i) => (
                            <div key={i}>{l}</div>
                        ))}
                    </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-2xl border border-yellow-200 dark:border-yellow-700">
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">Common Issues</h3>
                    <ul className="list-disc ml-5 space-y-1 text-sm text-yellow-900 dark:text-yellow-200">
                        <li><b>HTTPS:</b> Voice input BLOCKS on http:// unless it is localhost. Are you using an IP address?</li>
                        <li><b>Brave Browser:</b> Blocks Google Services by default. Enable in Settings &gt; Privacy.</li>
                        <li><b>Microphone Permission:</b> Check the icon in your address bar. Is it blocked?</li>
                        <li><b>Windows Privacy:</b> Check Windows Settings &gt; Privacy &gt; Microphone.</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
