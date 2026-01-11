import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { Building2, Save, MapPin, Phone, Hospital, AlertCircle } from "lucide-react";

export default function HospitalSettings() {
    const [settings, setSettings] = useState({
        hospital_name: "",
        address: "",
        contact_number: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('hospital_settings').select('*').eq('id', 1).single();

        if (error) {
            console.error("Error fetching settings:", error);
            if (error.code !== "PGRST116") { // Ignore 'no rows found' error
                setError("Failed to load settings. Please check database permissions.");
            }
        }

        if (data) setSettings(data);
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const { error } = await supabase.from('hospital_settings').upsert({ id: 1, ...settings });

        if (!error) {
            alert("✔ Hospital Details Updated!");
        } else {
            console.error(error);
            setError("Error saving details: " + error.message);
            alert("Error: " + error.message);
        }
        setSaving(false);
    };

    return (
        <Layout title="Hospital Setup">
            <div className="max-w-2xl mx-auto py-10">
                <div className="glass-card bg-white dark:bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-4 mb-10 pb-8 border-b border-gray-100 dark:border-white/10">
                        <div className="bg-blue-500/10 dark:bg-blue-500/20 p-4 rounded-2xl shadow-lg shadow-blue-500/10">
                            <Hospital className="text-blue-600 dark:text-blue-400 w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Clinic Profile</h2>
                            <p className="text-gray-500 dark:text-white/50 font-medium">Configure your clinic's public identity</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 font-medium">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-white/60 uppercase tracking-widest ml-1">
                                <Building2 size={14} /> Hospital / Clinic Name
                            </label>
                            <input
                                required
                                className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-blue-500 rounded-2xl outline-none transition-all text-xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20"
                                placeholder="Enter Hospital Name"
                                value={settings.hospital_name}
                                onChange={e => setSettings({ ...settings, hospital_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-white/60 uppercase tracking-widest ml-1">
                                <MapPin size={14} /> Full Address
                            </label>
                            <textarea
                                required
                                className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-blue-500 rounded-2xl outline-none transition-all text-lg font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 h-32 resize-none"
                                placeholder="Enter Full Address"
                                value={settings.address}
                                onChange={e => setSettings({ ...settings, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-white/60 uppercase tracking-widest ml-1">
                                <Phone size={14} /> Contact Number
                            </label>
                            <input
                                required
                                className="w-full p-5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-blue-500 rounded-2xl outline-none transition-all text-xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20"
                                placeholder="+91 xxxxx xxxxx"
                                value={settings.contact_number}
                                onChange={e => setSettings({ ...settings, contact_number: e.target.value })}
                            />
                        </div>

                        <button
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-2xl text-xl font-black shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-10"
                        >
                            <Save size={24} />
                            {saving ? "SAVING DETAILS..." : "SAVE HOSPITAL SETTINGS"}
                        </button>
                    </form>
                </div>

                <div className="mt-8 p-6 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 flex items-start gap-4 text-gray-500 dark:text-white/60 shadow-lg dark:shadow-none">
                    <div className="bg-gray-100 dark:bg-white/10 p-2 rounded-full text-gray-600 dark:text-white/80">
                        <Save size={16} />
                    </div>
                    <p className="text-sm font-medium">
                        These details will appear on patient reports, bills, and the registration portal. Please ensure accuracy.
                    </p>
                </div>
            </div>
        </Layout>
    );
}
