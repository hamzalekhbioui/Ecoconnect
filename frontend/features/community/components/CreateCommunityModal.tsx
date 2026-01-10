import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    // Generate slug from name
    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Community name is required');
            return;
        }

        if (!user) {
            setError('You must be logged in to create a community');
            return;
        }

        setIsSubmitting(true);

        try {
            const slug = generateSlug(name);
            const tagsArray = tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            const { data: communityData, error: insertError } = await supabase
                .from('communities')
                .insert({
                    name: name.trim(),
                    slug,
                    description: description.trim() || null,
                    cover_image: coverImage.trim() || null,
                    is_private: isPrivate,
                    tags: tagsArray,
                    member_count: 1, // Creator is first member
                    created_by: user.id, // Track who created the community
                })
                .select('id')
                .single();

            if (insertError) {
                if (insertError.code === '23505') {
                    throw new Error('A community with this name already exists');
                }
                throw new Error(insertError.message);
            }

            // Add creator as admin member of the community
            if (communityData?.id) {
                const { error: memberError } = await supabase
                    .from('community_members')
                    .insert({
                        user_id: user.id,
                        community_id: communityData.id,
                        role: 'admin',
                        status: 'approved',
                    });

                if (memberError) {
                    console.error('Error adding creator as member:', memberError);
                }
            }

            // Reset form
            setName('');
            setDescription('');
            setCoverImage('');
            setIsPrivate(false);
            setTags('');

            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create community');
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">Create Community</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Community Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Sustainable Fashion Collective"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            maxLength={100}
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this community is about..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            maxLength={500}
                        />
                    </div>

                    {/* Cover Image URL */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cover Image URL
                        </label>
                        <div className="relative">
                            <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="url"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Paste a URL to an image (Unsplash, Imgur, etc.)
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Sustainability, Fashion, DIY (comma-separated)"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    {/* Privacy Toggle */}
                    <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div
                                className={`relative w-12 h-6 rounded-full transition-colors ${isPrivate ? 'bg-emerald-500' : 'bg-gray-200'
                                    }`}
                                onClick={() => setIsPrivate(!isPrivate)}
                            >
                                <div
                                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPrivate ? 'left-6' : 'left-0.5'
                                        }`}
                                />
                            </div>
                            <div>
                                <span className="font-medium text-gray-900">Private Community</span>
                                <p className="text-xs text-gray-500">
                                    {isPrivate
                                        ? 'Members need approval to join'
                                        : 'Anyone can join this community'}
                                </p>
                            </div>
                        </label>
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
                            disabled={isSubmitting || !name.trim()}
                            className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Community'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
