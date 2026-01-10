import React from 'react';
import {
    LayoutDashboard,
    Users,
    Package,
    Calendar,
    ChevronLeft,
    ChevronRight,
    LogOut,
    ShoppingBag,
    Building2,
    Flag
} from 'lucide-react';

interface AdminSidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const navItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'admin-communities', label: 'Communities', icon: Building2 },
    { id: 'admin-resources', label: 'Resources', icon: Package },
    { id: 'admin-marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'admin-reports', label: 'Reports', icon: Flag },
    { id: 'admin-events', label: 'Events', icon: Calendar },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    currentPage,
    onNavigate,
    onLogout,
    isCollapsed,
    onToggleCollapse
}) => {
    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700 flex flex-col transition-all duration-300 z-40
                ${isCollapsed ? 'w-16' : 'w-64'}`}
        >
            {/* Logo Section */}
            <div className="h-16 flex items-center px-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0">
                        <span className="material-symbols-outlined icon-filled text-[18px] text-slate-900">eco</span>
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <h1 className="text-lg font-bold text-white truncate">Symbiosis</h1>
                            <p className="text-xs text-slate-400 -mt-0.5">Admin Portal</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 overflow-y-auto">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => onNavigate(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                        ${isActive
                                            ? 'bg-slate-700/50 text-white'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                                    {!isCollapsed && (
                                        <span className="font-medium truncate">{item.label}</span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Section */}
            <div className="p-2 border-t border-slate-700 space-y-1">
                {/* Sign Out Button */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title={isCollapsed ? 'Sign Out' : undefined}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">Sign Out</span>}
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={onToggleCollapse}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};
