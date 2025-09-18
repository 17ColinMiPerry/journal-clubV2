import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";



interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Don't render anything until we know the auth state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-indigo-200">Loading...</div>
            </div>
        );
    }

    if (!currentUser) {
        // Save where they were trying to go
        return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
    }

    // Auth check passed, show the protected content
    // Safety: Only render children when we're definitely authenticated and they exist
    return typeof children === 'undefined' ? null : <>{children}</>;
}