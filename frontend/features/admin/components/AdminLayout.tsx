import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface AdminLayoutProps {
    children: React.ReactNode;
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    currentPage,
    onNavigate,
    onLogout
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { profile } = useAuth();

    // Get page title based on current page
    const getPageTitle = () => {
        switch (currentPage) {
            case 'admin-dashboard':
                return 'Dashboard';
            case 'admin-users':
                return 'User Management';
            case 'admin-communities':
                return 'Community Management';
            case 'admin-resources':
                return 'Resource Management';
            case 'admin-marketplace':
                return 'Marketplace Management';
            case 'admin-reports':
                return 'User Reports';
            case 'admin-events':
                return 'Event Management';
            default:
                return 'Admin Portal';
        }
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Sidebar */}
            <AdminSidebar
                currentPage={currentPage}
                onNavigate={onNavigate}
                onLogout={onLogout}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div
                className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}
            >
                {/* Top Header Bar */}
                <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-white">{getPageTitle()}</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Button */}
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
                        </button>

                        {/* Admin Badge */}
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                <span className="text-sm font-bold text-slate-900">
                                    {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
                                </span>
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-white truncate max-w-32">
                                    {profile?.full_name || 'Admin'}
                                </p>
                                <p className="text-xs text-slate-400">Administrator</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};
