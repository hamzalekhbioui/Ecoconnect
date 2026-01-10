import React, { useState } from 'react';
import { X, Flag, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { REPORT_REASONS, ReportReason } from '../services/userManagementService';

interface ReportUserModalProps {
    isOpen: boolean;
    userName: string;
    onClose: () => void;
    onSubmit: (reason: ReportReason, description: string, alsoBlock: boolean) => Promise<void>;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
    isOpen,
    userName,
    onClose,
    onSubmit
}) => {
    const [reason, setReason] = useState<ReportReason | ''>('');
    const [description, setDescription] = useState('');
    const [alsoBlock, setAlsoBlock] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason) {
            setError('Please select a reason for the report.');
            return;
        }

        if (reason === 'other' && !description.trim()) {
            setError('Please provide a description for "Other" reports.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(reason, description, alsoBlock);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to submit report');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setDescription('');
        setAlsoBlock(false);
        setIsSuccess(false);
        setError(null);
        onClose();
    };

    // Success state
    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you for your report</h2>
                    <p className="text-gray-600 mb-2">
                        Our moderation team will review it as soon as possible.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        You can block this user to prevent any further contact.
                    </p>
                    <button
                        onClick={handleClose}
                        className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-xl">
                            <Flag className="w-5 h-5 text-gray-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Report User</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <p className="text-sm text-gray-600 mb-4">
                        Help us understand what happened. Your report is confidential and will be reviewed by our moderation team.
                    </p>

                    {/* Reason Select */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for report <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value as ReportReason)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        >
                            <option value="">Select a reason...</option>
                            {REPORT_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional details {reason === 'other' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide more context about what happened..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            maxLength={1000}
                        />
                        <p className="mt-1 text-xs text-gray-500 text-right">
                            {description.length}/1000
                        </p>
                    </div>

                    {/* Also Block Checkbox */}
                    <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={alsoBlock}
                                onChange={(e) => setAlsoBlock(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                            />
                            <div>
                                <span className="font-medium text-gray-900">Also block this user</span>
                                <p className="text-xs text-gray-500">
                                    Prevent them from contacting you in the future
                                </p>
                            </div>
                        </label>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                        Note: The last 5 messages will be included in your report for context.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason}
                            className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Report'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
