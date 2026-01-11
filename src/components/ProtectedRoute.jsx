import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading...</p>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirect based on role
        if (role === 'admin') return <Navigate to="/admin" replace />;
        if (role === 'doctor') return <Navigate to="/doctor" replace />;
        if (role === 'receptionist') return <Navigate to="/receptionist" replace />;
        if (role === 'patient') return <Navigate to="/patient" replace />;
        return <Navigate to="/login" replace />; // Should not happen if role is valid
    }

    return children;
}
