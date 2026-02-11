import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import DashboardButton from "../../components/DashboardButton";
import { UserPlus, CalendarPlus, Pill, ClipboardList, CheckSquare } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ReceptionistDashboard() {
    const [expiredCount, setExpiredCount] = useState(0);

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

    return (
        <Layout title="Staff Dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                <DashboardButton
                    title="Add Patient"
                    icon={UserPlus}
                    to="/receptionist/register-patient"
                    color="from-purple-500 to-pink-600"
                />
                <DashboardButton
                    title="Book Appointment"
                    icon={CalendarPlus}
                    to="/receptionist/book-appointment"
                    color="from-blue-500 to-indigo-600"
                />
                <DashboardButton
                    title="Medicine Stock"
                    icon={Pill}
                    to="/receptionist/inventory"
                    color="from-emerald-500 to-teal-600"
                    alert={expiredCount > 0}
                />
                <DashboardButton
                    title="Generate Bill"
                    icon={ClipboardList}
                    to="/receptionist/billing"
                    color="from-rose-500 to-red-600"
                />
                <DashboardButton
                    title="Worker Face Attendance"
                    icon={CheckSquare}
                    to="/receptionist/worker-attendance"
                    color="from-slate-700 to-slate-900"
                />
                <DashboardButton
                    title="Mark Own Attendance"
                    icon={CheckSquare}
                    to="/attendance"
                    color="from-cyan-500 to-blue-600"
                />
            </div>
        </Layout>
    );
}
