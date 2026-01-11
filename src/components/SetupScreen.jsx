import { useState } from "react";

export default function SetupScreen() {
    const [key, setKey] = useState("");

    const handleSave = () => {
        if (!key.trim()) return;
        localStorage.setItem('supabase_key', key.trim());
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
            <div className="max-w-xl w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
                <h2 className="text-3xl font-black text-center text-red-500 mb-4 tracking-tight">
                    ⚠️ Setup Required
                </h2>
                <p className="text-gray-400 mb-8 text-center text-lg">
                    The system could not find your Supabase API Key in the configuration.
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-8 text-sm text-yellow-200">
                    <strong className="text-yellow-400">Developer Note:</strong> You can also fix this by editing the <code className="bg-black/30 px-1 py-0.5 rounded font-mono text-yellow-100">.env</code> file in the project root.
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-300 font-bold text-lg mb-2">
                            Paste your "anon" public key here:
                        </label>
                        <textarea
                            className="w-full p-4 bg-black/40 border border-gray-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm text-gray-200 placeholder-gray-600 transition-all"
                            rows="4"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!key}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl text-xl hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                    >
                        SAVE & START APP
                    </button>
                    <p className="text-center text-gray-500 text-sm">
                        This key will be saved in your browser's local storage.
                    </p>
                </div>
            </div>
        </div>
    );
}
