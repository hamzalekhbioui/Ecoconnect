import React, { useState } from 'react';
import { X, Ban, Loader2, ShieldAlert } from 'lucide-react';

interface BlockUserModalProps {
    isOpen: boolean;
    userName: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
    isOpen,
    userName,
    onClose,
    onConfirm
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Error blocking user:', error);
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-xl">
                            <Ban className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Block User</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl mb-4">
                        <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">
                            <p className="font-semibold mb-2">Are you sure you want to block this user?</p>
                            <p className="text-red-700">
                                They will no longer be able to contact you or view your profile.
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 text-center mb-6">
                        This action is private and the user will not be notified.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Blocking...
                                </>
                            ) : (
                                'Block User'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
