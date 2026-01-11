import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorDiagnose from "./pages/doctor/DoctorDiagnose";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import RegisterPatient from "./pages/receptionist/RegisterPatient";
import BookAppointment from "./pages/receptionist/BookAppointment";
import Inventory from "./pages/shared/Inventory";
import PatientDashboard from "./pages/patient/PatientDashboard";
import SetupScreen from "./components/SetupScreen";
import { isKeyValid } from "./lib/supabase";
import Attendance from "./pages/shared/Attendance";
import AllAttendance from "./pages/admin/AllAttendance";
import AllBills from "./pages/admin/AllBills";
import DoctorsList from "./pages/admin/DoctorsList";
import StaffList from "./pages/admin/StaffList";
import PatientsList from "./pages/admin/PatientsList";
import Payroll from "./pages/admin/Payroll";
import WorkersList from "./pages/admin/WorkersList";
import HospitalSettings from "./pages/admin/HospitalSettings";
import Billing from "./pages/receptionist/Billing";
import WorkerAttendance from "./pages/receptionist/WorkerAttendance";
import AccountManager from "./pages/admin/AccountManager";
import DoctorRegistration from "./pages/admin/create-accounts/DoctorRegistration";
import ReceptionistRegistration from "./pages/admin/create-accounts/ReceptionistRegistration";
import WorkerRegistration from "./pages/admin/create-accounts/WorkerRegistration";
import AdminRegistration from "./pages/admin/create-accounts/AdminRegistration";
import VoiceDebug from "./pages/test/VoiceDebug";

function HomeRedirect() {
  const { user, role, loading, logout } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center text-blue-600 font-bold">Loading User Data...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'doctor') return <Navigate to="/doctor" replace />;
  if (role === 'receptionist') return <Navigate to="/receptionist" replace />;
  if (role === 'patient') return <Navigate to="/patient" replace />;

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold">Access Issue</h2>
      <p>User Role Not Found: <span className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">{role || 'null'}</span></p>
      <p className="text-sm opacity-70">Your account might be missing a role. Please contact support.</p>
      <button
        onClick={() => logout()}
        className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg"
      >
        Logout & Try Again
      </button>
    </div>
  );
}

import { ThemeProvider } from "./contexts/ThemeContext";

export default function App() {
  if (!isKeyValid()) {
    return <SetupScreen />;
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* ADMIN */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/medicines" element={
              <ProtectedRoute allowedRoles={['admin', 'doctor']}>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/admin/doctors" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DoctorsList />
              </ProtectedRoute>
            } />
            <Route path="/admin/staff" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StaffList />
              </ProtectedRoute>
            } />
            <Route path="/admin/patients" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PatientsList />
              </ProtectedRoute>
            } />
            <Route path="/admin/attendance" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AllAttendance />
              </ProtectedRoute>
            } />
            <Route path="/admin/bills" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AllBills />
              </ProtectedRoute>
            } />
            <Route path="/admin/payroll" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Payroll />
              </ProtectedRoute>
            } />
            <Route path="/admin/workers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <WorkersList />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HospitalSettings />
              </ProtectedRoute>
            } />

            {/* Account Creation Routes */}
            <Route path="/admin/accounts" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AccountManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/accounts/doctor" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DoctorRegistration />
              </ProtectedRoute>
            } />
            <Route path="/admin/accounts/receptionist" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReceptionistRegistration />
              </ProtectedRoute>
            } />
            <Route path="/admin/accounts/worker" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <WorkerRegistration />
              </ProtectedRoute>
            } />
            <Route path="/admin/accounts/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRegistration />
              </ProtectedRoute>
            } />

            {/* DOCTOR */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/doctor/diagnose/:id" element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDiagnose />
              </ProtectedRoute>
            } />

            {/* RECEPTIONIST */}
            <Route path="/receptionist" element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/register-patient" element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <RegisterPatient />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/book-appointment" element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <BookAppointment />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/inventory" element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <Inventory />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/billing" element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/receptionist/worker-attendance" element={
              <ProtectedRoute allowedRoles={['receptionist']}>
                <WorkerAttendance />
              </ProtectedRoute>
            } />
            {/* Receptionist attendance and list pages could be added */}

            {/* PATIENT */}
            <Route path="/patient" element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            } />

            <Route path="/attendance" element={
              <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                <Attendance />
              </ProtectedRoute>
            } />

            <Route path="/test/voice" element={
              <ProtectedRoute allowedRoles={['admin', 'doctor']}>
                <VoiceDebug />
              </ProtectedRoute>
            } />

            <Route path="/" element={<HomeRedirect />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
