import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { StatsCard } from '../shared/StatsCard';
import { DataTable, Column } from '../shared/DataTable';
import {
    Flag,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    Loader2,
    X
} from 'lucide-react';

interface Report {
    id: string;
    reporter_id: string;
    reported_id: string;
    reason: string;
    description: string | null;
    context_json: any;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    created_at: string;
    updated_at: string;
    reporter?: {
        full_name: string;
        email: string;
        avatar_url: string | null;
    };
    reported?: {
        full_name: string;
        email: string;
        avatar_url: string | null;
    };
}

interface AdminReportsViewProps {
    onNavigate: (page: string) => void;
}

const REASON_LABELS: Record<string, string> = {
    harassment_abusive: 'Harassment / Abusive',
    spam_solicitation: 'Spam / Solicitation',
    scam_fraud: 'Scam / Fraud',
    inappropriate_content: 'Inappropriate Content',
    community_values: 'Community Values',
    other: 'Other'
};

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({ onNavigate }) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [viewReport, setViewReport] = useState<Report | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        dismissed: 0
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select(`
                    *,
                    reporter:profiles!reports_reporter_id_profiles_fkey(full_name, email, avatar_url),
                    reported:profiles!reports_reported_id_profiles_fkey(full_name, email, avatar_url)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const reportsData = data as Report[];
            setReports(reportsData);
            setFilteredReports(reportsData);

            // Calculate stats
            setStats({
                total: reportsData.length,
                pending: reportsData.filter(r => r.status === 'pending').length,
                resolved: reportsData.filter(r => r.status === 'resolved').length,
                dismissed: reportsData.filter(r => r.status === 'dismissed').length
            });
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        const filtered = reports.filter(
            report =>
                report.reporter?.full_name.toLowerCase().includes(query.toLowerCase()) ||
                report.reported?.full_name.toLowerCase().includes(query.toLowerCase()) ||
                report.reason.toLowerCase().includes(query.toLowerCase()) ||
                report.description?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredReports(filtered);
    };

    const handleUpdateStatus = async (reportId: string, newStatus: 'resolved' | 'dismissed') => {
        setUpdating(reportId);
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status: newStatus })
                .eq('id', reportId);

            if (error) throw error;

            // Update local state
            const updatedReports = reports.map(r =>
                r.id === reportId ? { ...r, status: newStatus } : r
            );
            setReports(updatedReports);
            setFilteredReports(filteredReports.map(r =>
                r.id === reportId ? { ...r, status: newStatus } : r
            ));

            // Recalculate stats
            const oldReport = reports.find(r => r.id === reportId);
            if (oldReport) {
                setStats(prev => ({
                    ...prev,
                    pending: oldReport.status === 'pending' ? prev.pending - 1 : prev.pending,
                    resolved: newStatus === 'resolved' ? prev.resolved + 1 : prev.resolved,
                    dismissed: newStatus === 'dismissed' ? prev.dismissed + 1 : prev.dismissed
                }));
            }

            if (viewReport?.id === reportId) {
                setViewReport({ ...viewReport, status: newStatus });
            }
        } catch (error) {
            console.error('Error updating report status:', error);
            alert('Failed to update report status.');
        } finally {
            setUpdating(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-500/20 text-amber-400';
            case 'reviewed':
                return 'bg-blue-500/20 text-blue-400';
            case 'resolved':
                return 'bg-emerald-500/20 text-emerald-400';
            case 'dismissed':
                return 'bg-slate-500/20 text-slate-400';
            default:
                return 'bg-slate-500/20 text-slate-400';
        }
    };

    const getReasonStyle = (reason: string) => {
        switch (reason) {
            case 'harassment_abusive':
                return 'bg-red-500/20 text-red-400';
            case 'spam_solicitation':
                return 'bg-orange-500/20 text-orange-400';
            case 'scam_fraud':
                return 'bg-purple-500/20 text-purple-400';
            case 'inappropriate_content':
                return 'bg-pink-500/20 text-pink-400';
            case 'community_values':
                return 'bg-teal-500/20 text-teal-400';
            default:
                return 'bg-slate-500/20 text-slate-400';
        }
    };

    const columns: Column<Report>[] = [
        {
            key: 'reporter',
            header: 'Reporter',
            render: (report) => (
                <div className="flex items-center gap-2">
                    {report.reporter?.avatar_url ? (
                        <img
                            src={report.reporter.avatar_url}
                            alt={report.reporter.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                                {report.reporter?.full_name?.charAt(0) || '?'}
                            </span>
                        </div>
                    )}
                    <span className="text-slate-300 text-sm">{report.reporter?.full_name || 'Unknown'}</span>
                </div>
            )
        },
        {
            key: 'reported',
            header: 'Reported User',
            render: (report) => (
                <div className="flex items-center gap-2">
                    {report.reported?.avatar_url ? (
                        <img
                            src={report.reported.avatar_url}
                            alt={report.reported.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center">
                            <span className="text-xs font-medium text-red-400">
                                {report.reported?.full_name?.charAt(0) || '?'}
                            </span>
                        </div>
                    )}
                    <span className="text-red-300 text-sm font-medium">{report.reported?.full_name || 'Unknown'}</span>
                </div>
            )
        },
        {
            key: 'reason',
            header: 'Reason',
            render: (report) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonStyle(report.reason)}`}>
                    {REASON_LABELS[report.reason] || report.reason}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (report) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(report.status)}`}>
                    {report.status}
                </span>
            )
        },
        {
            key: 'created_at',
            header: 'Submitted',
            render: (report) => (
                <span className="text-slate-400 text-xs">
                    {new Date(report.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-white">User Reports</h2>
                <p className="text-sm text-slate-400">Review and manage user reports</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Reports"
                    value={stats.total}
                    icon={<Flag className="w-5 h-5" />}
                    color="blue"
                />
                <StatsCard
                    title="Pending Review"
                    value={stats.pending}
                    icon={<Clock className="w-5 h-5" />}
                    color="amber"
                />
                <StatsCard
                    title="Resolved"
                    value={stats.resolved}
                    icon={<CheckCircle className="w-5 h-5" />}
                    color="emerald"
                />
                <StatsCard
                    title="Dismissed"
                    value={stats.dismissed}
                    icon={<XCircle className="w-5 h-5" />}
                    color="cyan"
                />
            </div>

            {/* Reports Table */}
            <DataTable
                data={filteredReports}
                columns={columns}
                pageSize={10}
                searchPlaceholder="Search reports by user, reason..."
                onSearch={handleSearch}
                loading={loading}
                emptyMessage="No reports found"
                actions={(report) => (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setViewReport(report)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        {report.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                    disabled={updating === report.id}
                                    className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Mark Resolved"
                                >
                                    {updating === report.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                    disabled={updating === report.id}
                                    className="p-1.5 text-slate-400 hover:text-slate-300 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                                    title="Dismiss"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            />

            {/* View Report Modal */}
            {viewReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg max-h-[85vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                <h3 className="text-lg font-semibold text-white">Report Details</h3>
                            </div>
                            <button
                                onClick={() => setViewReport(null)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
                            {/* Status & Reason */}
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusStyle(viewReport.status)}`}>
                                    {viewReport.status}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReasonStyle(viewReport.reason)}`}>
                                    {REASON_LABELS[viewReport.reason] || viewReport.reason}
                                </span>
                            </div>

                            {/* Users */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-700/50 rounded-lg">
                                    <p className="text-xs text-slate-400 mb-2">Reporter</p>
                                    <div className="flex items-center gap-2">
                                        {viewReport.reporter?.avatar_url ? (
                                            <img
                                                src={viewReport.reporter.avatar_url}
                                                alt={viewReport.reporter.full_name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                                                <span className="text-xs font-medium text-white">
                                                    {viewReport.reporter?.full_name?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-white font-medium">{viewReport.reporter?.full_name}</p>
                                            <p className="text-xs text-slate-400">{viewReport.reporter?.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <p className="text-xs text-red-400 mb-2">Reported User</p>
                                    <div className="flex items-center gap-2">
                                        {viewReport.reported?.avatar_url ? (
                                            <img
                                                src={viewReport.reported.avatar_url}
                                                alt={viewReport.reported.full_name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center">
                                                <span className="text-xs font-medium text-red-400">
                                                    {viewReport.reported?.full_name?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-white font-medium">{viewReport.reported?.full_name}</p>
                                            <p className="text-xs text-slate-400">{viewReport.reported?.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {viewReport.description && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Description</p>
                                    <p className="text-sm text-slate-300 bg-slate-700/50 p-3 rounded-lg">
                                        {viewReport.description}
                                    </p>
                                </div>
                            )}

                            {/* Context Messages */}
                            {viewReport.context_json && viewReport.context_json.length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">Message Context</p>
                                    <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                        {viewReport.context_json.map((msg: any, idx: number) => (
                                            <div key={idx} className="text-xs">
                                                <span className="text-emerald-400 font-medium">{msg.sender_name}:</span>
                                                <span className="text-slate-300 ml-2">{msg.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timestamp */}
                            <p className="text-xs text-slate-500">
                                Submitted: {new Date(viewReport.created_at).toLocaleString()}
                            </p>
                        </div>

                        {/* Actions */}
                        {viewReport.status === 'pending' && (
                            <div className="flex gap-3 p-4 border-t border-slate-700">
                                <button
                                    onClick={() => handleUpdateStatus(viewReport.id, 'dismissed')}
                                    disabled={updating === viewReport.id}
                                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {updating === viewReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(viewReport.id, 'resolved')}
                                    disabled={updating === viewReport.id}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {updating === viewReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Mark Resolved
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
