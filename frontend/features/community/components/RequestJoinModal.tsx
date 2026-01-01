import React, { useState } from 'react';
import { Community } from '../../../types';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface RequestJoinModalProps {
    isOpen: boolean;
    onClose: () => void;
    community: Community;
    onSubmit?: (message: string) => void;
}

export const RequestJoinModal: React.FC<RequestJoinModalProps> = ({
    isOpen,
    onClose,
    community,
    onSubmit,
}) => {
    const { user, profile } = useAuth();
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    // Check if user has member role
    const canJoinCommunity = profile?.role === 'member' || profile?.role === 'admin';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!user) {
                throw new Error('You must be logged in to join a community');
            }

            // Check role before allowing join
            if (!canJoinCommunity) {
                throw new Error('Only members can join communities. Please upgrade your account.');
            }

            // Insert membership request into Supabase
            const { error: insertError } = await supabase
                .from('community_members')
                .insert({
                    user_id: user.id,
                    community_id: community.id,
                    role: 'member',
                    status: community.isPrivate ? 'pending' : 'approved',
                });

            if (insertError) {
                // Handle duplicate entry gracefully
                if (insertError.code === '23505') {
                    throw new Error('You have already requested to join this community');
                }
                throw new Error(insertError.message);
            }

            if (onSubmit) {
                onSubmit(message);
            }

            setIsSuccess(true);

            // Auto close after success
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setMessage('');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-500 p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>

                    <div className="h-full flex items-end">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-white/80 text-[18px]">
                                    {community.isPrivate ? 'lock' : 'groups'}
                                </span>
                                <span className="text-white/80 text-sm font-medium">
                                    {community.isPrivate ? 'Private Community' : 'Community'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">{community.name}</h2>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isSuccess ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl text-emerald-600">check</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
                            <p className="text-gray-600">
                                The community admins will review your request. You'll be notified once approved.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Warning for visitors (non-members) */}
                            {!canJoinCommunity && (
                                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                    <span className="material-symbols-outlined text-amber-500">warning</span>
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">Membership Required</p>
                                        <p className="text-sm text-amber-700">
                                            Only members can join communities. Please contact an admin to upgrade your account.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <p className="text-gray-600 mb-6">
                                {community.isPrivate
                                    ? 'This is a private community. Your request will be reviewed by the community admins.'
                                    : 'Tell us a bit about yourself and why you want to join this community.'}
                            </p>

                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                    <span className="material-symbols-outlined text-red-500">error</span>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Introduce yourself (optional)
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Share your background, interests, and what you hope to contribute..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Community Info */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-emerald-600">diversity_3</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">You're joining</p>
                                            <p className="font-semibold text-gray-900">{community.name}</p>
                                            <p className="text-sm text-gray-500">{community.memberCount.toLocaleString()} members</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !canJoinCommunity}
                                        className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : !canJoinCommunity ? (
                                            'Membership Required'
                                        ) : community.isPrivate ? (
                                            'Request to Join'
                                        ) : (
                                            'Join Community'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

