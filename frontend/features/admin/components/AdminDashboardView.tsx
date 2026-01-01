import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { StatsCard } from '../shared/StatsCard';
import {
    Users,
    Package,
    Calendar,
    ClipboardCheck,
    ArrowRight,
    TrendingUp
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface AdminDashboardViewProps {
    onNavigate: (page: string) => void;
}

interface Stats {
    totalUsers: number;
    activeResources: number;
    pendingApplications: number;
    upcomingEvents: number;
}

// Mock activity data for the chart (in production, this would come from the database)
const activityData = [
    { name: 'Mon', users: 12, resources: 4, events: 2 },
    { name: 'Tue', users: 19, resources: 7, events: 3 },
    { name: 'Wed', users: 15, resources: 5, events: 1 },
    { name: 'Thu', users: 25, resources: 9, events: 4 },
    { name: 'Fri', users: 32, resources: 12, events: 6 },
    { name: 'Sat', users: 18, resources: 6, events: 2 },
    { name: 'Sun', users: 14, resources: 3, events: 1 },
];

const quickActions = [
    {
        id: 'approve-users',
        title: 'Approve Users',
        description: 'Review pending member applications',
        icon: Users,
        color: 'emerald',
        navigateTo: 'admin-users'
    },
    {
        id: 'review-resources',
        title: 'Review Resources',
        description: 'Manage community resources',
        icon: Package,
        color: 'blue',
        navigateTo: 'admin-resources'
    },
    {
        id: 'schedule-event',
        title: 'Schedule Event',
        description: 'Create or manage events',
        icon: Calendar,
        color: 'purple',
        navigateTo: 'admin-events'
    },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeResources: 0,
        pendingApplications: 0,
        upcomingEvents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch total users count
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Fetch resources count
            const { count: resourcesCount } = await supabase
                .from('resources')
                .select('*', { count: 'exact', head: true });

            // Fetch pending applications count
            const { count: applicationsCount } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'new');

            // Fetch upcoming events count
            const { count: eventsCount } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .gte('date', new Date().toISOString());

            setStats({
                totalUsers: usersCount || 0,
                activeResources: resourcesCount || 0,
                pendingApplications: applicationsCount || 0,
                upcomingEvents: eventsCount || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Admin Portal</h2>
                <p className="text-slate-400">
                    Monitor platform activity, manage users, and oversee community resources from one dashboard.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Users"
                    value={loading ? '...' : stats.totalUsers}
                    icon={<Users className="w-5 h-5" />}
                    color="emerald"
                    change={{ value: 12, label: 'vs last month' }}
                />
                <StatsCard
                    title="Active Resources"
                    value={loading ? '...' : stats.activeResources}
                    icon={<Package className="w-5 h-5" />}
                    color="blue"
                    change={{ value: 8, label: 'vs last month' }}
                />
                <StatsCard
                    title="Pending Applications"
                    value={loading ? '...' : stats.pendingApplications}
                    icon={<ClipboardCheck className="w-5 h-5" />}
                    color="amber"
                />
                <StatsCard
                    title="Upcoming Events"
                    value={loading ? '...' : stats.upcomingEvents}
                    icon={<Calendar className="w-5 h-5" />}
                    color="purple"
                />
            </div>

            {/* Charts and Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Chart */}
                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Platform Activity</h3>
                            <p className="text-sm text-slate-400">User registrations & resource uploads this week</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-slate-400">Users</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-slate-400">Resources</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorResources" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#10b981"
                                    fill="url(#colorUsers)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="resources"
                                    stroke="#3b82f6"
                                    fill="url(#colorResources)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => onNavigate(action.navigateTo)}
                                    className="w-full p-4 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 rounded-lg transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-${action.color}-500/10`}>
                                            <Icon className={`w-5 h-5 text-${action.color}-400`} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                                                {action.title}
                                            </h4>
                                            <p className="text-xs text-slate-400">{action.description}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                    <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                        View All
                    </button>
                </div>
                <div className="space-y-3">
                    {[
                        { action: 'New user registered', user: 'Marie Dupont', time: '5 minutes ago', type: 'user' },
                        { action: 'Resource submitted for review', user: 'Jean Martin', time: '15 minutes ago', type: 'resource' },
                        { action: 'Event created', user: 'Sophie Lefebvre', time: '1 hour ago', type: 'event' },
                        { action: 'Application approved', user: 'Pierre Bernard', time: '2 hours ago', type: 'approval' },
                    ].map((activity, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 p-3 bg-slate-900/30 rounded-lg"
                        >
                            <div className={`w-2 h-2 rounded-full ${activity.type === 'user' ? 'bg-emerald-500' :
                                    activity.type === 'resource' ? 'bg-blue-500' :
                                        activity.type === 'event' ? 'bg-purple-500' :
                                            'bg-amber-500'
                                }`}></div>
                            <div className="flex-1">
                                <p className="text-sm text-white">{activity.action}</p>
                                <p className="text-xs text-slate-400">{activity.user}</p>
                            </div>
                            <span className="text-xs text-slate-500">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
