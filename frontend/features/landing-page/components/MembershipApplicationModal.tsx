import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { X, Loader2, CheckCircle, Send } from 'lucide-react';

interface MembershipApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const COUNTRIES = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
    'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland',
    'Austria', 'Australia', 'New Zealand', 'Japan', 'South Korea',
    'Singapore', 'India', 'Brazil', 'Mexico', 'Argentina',
    'Morocco', 'South Africa', 'Nigeria', 'Kenya', 'Egypt',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland',
    'Portugal', 'Ireland', 'Czech Republic', 'Other'
];

export const MembershipApplicationModal: React.FC<MembershipApplicationModalProps> = ({
    isOpen,
    onClose
}) => {
    const { user, profile } = useAuth();
    const [fullName, setFullName] = useState('');
    const [country, setCountry] = useState('');
    const [applicationNote, setApplicationNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill name from profile
    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name);
        }
        if (profile?.country) {
            setCountry(profile.country);
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    country: country,
                    application_note: applicationNote,
                    status: 'pending_review'
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setIsSuccess(true);
        } catch (err) {
            console.error('Error submitting application:', err);
            setError('Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        // Reset state when closing
        setIsSuccess(false);
        setError(null);
        setApplicationNote('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 w-full max-w-md mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isSuccess ? 'Application Sent!' : 'Become a Member'}
                        </h3>
                        {!isSuccess && (
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                Apply for premium membership
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSuccess ? (
                    // Success State
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Thank You!
                        </h4>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">
                            Application sent! An admin will contact you for an interview.
                        </p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-secondary font-semibold rounded-lg transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                ) : (
                    // Application Form
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Country
                            </label>
                            <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            >
                                <option value="">Select your country</option>
                                {COUNTRIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Why do you want to join?
                            </label>
                            <textarea
                                value={applicationNote}
                                onChange={(e) => setApplicationNote(e.target.value)}
                                required
                                rows={4}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                                placeholder="Tell us about yourself and why you'd like to become a member..."
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-white font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-secondary font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
