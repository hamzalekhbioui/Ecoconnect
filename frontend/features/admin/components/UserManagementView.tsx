import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, Column } from '../shared/DataTable';
import { ActionButtons } from '../shared/ActionButtons';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Calendar,
    X,
    Save,
    Loader2,
    CheckCircle,
    XCircle,
    MapPin,
    FileText
} from 'lucide-react';

interface User {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    role: 'admin' | 'member' | 'visitor';
    status: 'pending' | 'approved';
    credits: number;
    created_at: string;
    country?: string;
    application_note?: string;
}

interface UserManagementViewProps {
    onNavigate: (page: string) => void;
}

// ReviewCard Component for pending applications
const ReviewCard: React.FC<{
    user: User;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isProcessing: boolean;
}> = ({ user, onApprove, onReject, isProcessing }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
        <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-lg font-semibold text-slate-300">
                        {user.full_name.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h4 className="font-semibold text-white">{user.full_name}</h4>
                        <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                        Pending Review
                    </span>
                </div>

                {/* Country */}
                {user.country && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{user.country}</span>
                    </div>
                )}

                {/* Application Note */}
                {user.application_note && (
                    <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <FileText className="w-3 h-3" />
                            <span>Application Note</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {user.application_note}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={() => onApprove(user.id)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                    </button>
                    <button
                        onClick={() => onReject(user.id)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <XCircle className="w-4 h-4" />
                        Reject
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export const UserManagementView: React.FC<UserManagementViewProps> = ({ onNavigate }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [savingUser, setSavingUser] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [processingApplication, setProcessingApplication] = useState<string | null>(null);

    // Derived state for pending applications
    const pendingApplications = users.filter(u => u.status === 'pending_review');

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        members: 0,
        visitors: 0,
        interviews: 0
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const usersData = data as User[];
            setUsers(usersData);
            setFilteredUsers(usersData);

            // Calculate stats
            setStats({
                total: usersData.length,
                pending: usersData.filter(u => u.status === 'pending').length,
                members: usersData.filter(u => u.role === 'member').length,
                visitors: usersData.filter(u => u.role === 'visitor').length,
                interviews: 0 // Default, will be updated if table exists
            });

            // Try to fetch upcoming interviews (table may not exist yet)
            try {
                const { count: interviewCount, error: interviewError } = await supabase
                    .from('vetting_sessions')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'scheduled')
                    .gte('scheduled_at', new Date().toISOString());

                if (!interviewError && interviewCount !== null) {
                    setStats(prev => ({ ...prev, interviews: interviewCount }));
                }
            } catch {
                // vetting_sessions table may not exist yet - silently ignore
                console.log('vetting_sessions table not found - showing 0 interviews');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        const filtered = users.filter(
            user =>
                user.status !== 'pending_review' && (
                    user.full_name.toLowerCase().includes(query.toLowerCase()) ||
                    user.email?.toLowerCase().includes(query.toLowerCase())
                )
        );
        setFilteredUsers(filtered);
    };

    const handleApprove = async (userId: string) => {
        setProcessingApplication(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    status: 'approved',
                    role: 'member'
                })
                .eq('id', userId);

            if (error) throw error;

            await fetchUsers();
        } catch (error) {
            console.error('Error approving user:', error);
        } finally {
            setProcessingApplication(null);
        }
    };

    const handleReject = async (userId: string) => {
        setProcessingApplication(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    status: 'rejected'
                })
                .eq('id', userId);

            if (error) throw error;

            await fetchUsers();
        } catch (error) {
            console.error('Error rejecting user:', error);
        } finally {
            setProcessingApplication(null);
        }
    };

    const handleEditUser = async () => {
        if (!editingUser) return;
        setSavingUser(true);

        try {
            // Debug: Log exactly what we're sending to Supabase
            console.log('[UserManagement] Updating user:', {
                userId: editingUser.id,
                newRole: editingUser.role,
                newStatus: editingUser.status,
                roleType: typeof editingUser.role
            });

            const { data, error } = await supabase
                .from('profiles')
                .update({
                    role: editingUser.role,
                    status: editingUser.status
                })
                .eq('id', editingUser.id)
                .select();

            // Debug: Log the response
            console.log('[UserManagement] Supabase response:', { data, error });

            if (error) throw error;

            await fetchUsers();
            setEditingUser(null);
        } catch (error) {
            console.error('Error updating user:', error);
        } finally {
            setSavingUser(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            await fetchUsers();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const columns: Column<User>[] = [
        {
            key: 'avatar',
            header: '',
            render: (user) => (
                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-medium text-slate-300">
                            {user.full_name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'full_name',
            header: 'Name',
            sortable: true,
            render: (user) => (
                <span className="font-medium text-white">{user.full_name}</span>
            )
        },
        {
            key: 'email',
            header: 'Email',
            render: (user) => (
                <span className="text-slate-400">{user.email || '-'}</span>
            )
        },
        {
            key: 'role',
            header: 'Role',
            render: (user) => {
                const roleStyles = {
                    admin: 'bg-purple-500/20 text-purple-400',
                    member: 'bg-emerald-500/20 text-emerald-400',
                    visitor: 'bg-slate-500/20 text-slate-400'
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleStyles[user.role]}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                );
            }
        },
        {
            key: 'status',
            header: 'Status',
            render: (user) => {
                const statusStyles: Record<string, string> = {
                    approved: 'bg-emerald-500/20 text-emerald-400',
                    pending: 'bg-amber-500/20 text-amber-400'
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[user.status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {user.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                );
            }
        },
        {
            key: 'credits',
            header: 'Credits',
            render: (user) => (
                <span className="text-slate-300">{user.credits}</span>
            )
        },
        {
            key: 'created_at',
            header: 'Joined',
            render: (user) => (
                <span className="text-slate-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard
                    title="Total Users"
                    value={stats.total}
                    icon={<Users className="w-5 h-5" />}
                    color="emerald"
                />
                <StatsCard
                    title="Pending Approval"
                    value={stats.pending}
                    icon={<Clock className="w-5 h-5" />}
                    color="amber"
                />
                <StatsCard
                    title="Interviews Scheduled"
                    value={stats.interviews}
                    icon={<Calendar className="w-5 h-5" />}
                    color="cyan"
                />
                <StatsCard
                    title="Members"
                    value={stats.members}
                    icon={<UserCheck className="w-5 h-5" />}
                    color="blue"
                />
                <StatsCard
                    title="Visitors"
                    value={stats.visitors}
                    icon={<UserX className="w-5 h-5" />}
                    color="purple"
                />
            </div>

            {/* Pending Applications Section */}
            {pendingApplications.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-400" />
                            Pending Applications
                            <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                                {pendingApplications.length}
                            </span>
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {pendingApplications.map(user => (
                            <ReviewCard
                                key={user.id}
                                user={user}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                isProcessing={processingApplication === user.id}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Member Directory */}
            <h3 className="text-lg font-semibold text-white">Member Directory</h3>
            {/* User Table */}
            <DataTable
                data={filteredUsers}
                columns={columns}
                pageSize={10}
                searchPlaceholder="Search by name or email..."
                onSearch={handleSearch}
                loading={loading}
                emptyMessage="No users found"
                actions={(user) => (
                    <ActionButtons
                        onEdit={() => setEditingUser(user)}
                        onDelete={() => setDeleteConfirm(user.id)}
                    />
                )}
            />

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Edit User</h3>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    User
                                </label>
                                <p className="text-white font-medium">{editingUser.full_name}</p>
                                <p className="text-sm text-slate-400">{editingUser.email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Role
                                </label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => {
                                        const newRole = e.target.value as User['role'];
                                        // Auto-sync status with role
                                        const newStatus = newRole === 'member' || newRole === 'admin' ? 'approved' : 'pending';
                                        setEditingUser({
                                            ...editingUser,
                                            role: newRole,
                                            status: newStatus
                                        });
                                    }}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="visitor">Visitor</option>
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Status <span className="text-slate-500 font-normal">(auto-set by role)</span>
                                </label>
                                <div className="w-full px-3 py-2 bg-slate-900/30 border border-slate-700 rounded-lg text-slate-400">
                                    {editingUser.status === 'approved' ? 'Approved' : 'Pending'}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditUser}
                                disabled={savingUser}
                                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {savingUser ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete User?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            This action cannot be undone. The user will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteUser(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
