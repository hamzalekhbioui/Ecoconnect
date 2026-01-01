import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2, ShieldX, AlertTriangle } from 'lucide-react';

interface AdminGuardProps {
    children: React.ReactNode;
    onNavigate: (page: string) => void;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onNavigate }) => {
    const { profile, loading, isAuthenticated } = useAuth();
    const [timedOut, setTimedOut] = useState(false);

    // Cache admin verification to prevent flicker on tab switch
    const wasVerifiedAsAdmin = useRef(false);

    // Timeout after 8 seconds to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading || (isAuthenticated && profile === null)) {
                console.warn('AdminGuard: Verification timeout');
                setTimedOut(true);
            }
        }, 8000);

        return () => clearTimeout(timer);
    }, [loading, isAuthenticated, profile]);

    // Update verification cache when profile loads
    useEffect(() => {
        if (profile?.role === 'admin') {
            wasVerifiedAsAdmin.current = true;
        }
        // Clear cache if user signs out
        if (!isAuthenticated) {
            wasVerifiedAsAdmin.current = false;
        }
    }, [profile, isAuthenticated]);

    // If already verified as admin, show content immediately (no re-check)
    if (wasVerifiedAsAdmin.current && isAuthenticated) {
        return <>{children}</>;
    }

    // Handle timeout - show error with retry option
    if (timedOut) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="max-w-md w-full mx-4 p-8 bg-slate-800 rounded-2xl border border-slate-700 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Verification Timeout</h1>
                    <p className="text-slate-400 mb-6">
                        Unable to verify admin access. This could be due to a network issue or database configuration.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => onNavigate('home')}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading spinner only on initial load (not on tab switch)
    if (loading || (isAuthenticated && profile === null)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
                    <p className="text-slate-400">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        setTimeout(() => onNavigate('admin-login'), 0);
        return null;
    }

    // Show access denied if user is not an admin
    if (profile?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="max-w-md w-full mx-4 p-8 bg-slate-800 rounded-2xl border border-slate-700 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400 mb-6">
                        You don't have permission to access the Admin Portal.
                        This area is restricted to administrators only.
                    </p>
                    <button
                        onClick={() => onNavigate('home')}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    // First time verification passed - cache it and render
    wasVerifiedAsAdmin.current = true;
    return <>{children}</>;
};
