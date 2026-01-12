import React, { useState, useRef, useCallback } from 'react';
import { X, Loader2, ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { uploadCommunityCover } from '../services/communityStorageService';

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
    const [isPrivate, setIsPrivate] = useState(false);
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File upload state
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Generate slug from name
    const generateSlug = useCallback((text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback((file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPG, PNG, GIF, etc.)');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Image size must be less than 5MB');
            return;
        }

        setError(null);
        setCoverFile(file);

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setCoverPreview(previewUrl);
    }, []);

    // Handle file input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    // Handle drag events
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    // Remove selected file
    const handleRemoveFile = useCallback(() => {
        if (coverPreview) {
            URL.revokeObjectURL(coverPreview);
        }
        setCoverFile(null);
        setCoverPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [coverPreview]);

    // Click to open file picker
    const handleZoneClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
            let coverImageUrl: string | null = null;

            // Upload cover image if selected
            if (coverFile) {
                coverImageUrl = await uploadCommunityCover(coverFile, user.id);
            }

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
                    cover_image: coverImageUrl,
                    is_private: isPrivate,
                    tags: tagsArray,
                    member_count: 1,
                    created_by: user.id,
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

            // Clean up preview URL
            if (coverPreview) {
                URL.revokeObjectURL(coverPreview);
            }

            // Reset form
            setName('');
            setDescription('');
            setCoverFile(null);
            setCoverPreview(null);
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
    }, [name, user, coverFile, generateSlug, tags, description, isPrivate, coverPreview, onSuccess, onClose]);

    // Early return AFTER all hooks are declared
    if (!isOpen) return null;

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

                    {/* Cover Image Upload */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cover Image
                        </label>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                        />

                        {coverPreview ? (
                            /* Preview with remove button */
                            <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                <img
                                    src={coverPreview}
                                    alt="Cover preview"
                                    className="w-full h-40 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                                    {coverFile?.name}
                                </div>
                            </div>
                        ) : (
                            /* Drag and drop zone */
                            <div
                                onClick={handleZoneClick}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                    relative border-2 border-dashed rounded-xl p-8 cursor-pointer
                                    transition-all duration-200 text-center
                                    ${isDragOver
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`
                                        p-3 rounded-full transition-colors
                                        ${isDragOver ? 'bg-emerald-100' : 'bg-gray-100'}
                                    `}>
                                        <ImageIcon className={`
                                            w-6 h-6
                                            ${isDragOver ? 'text-emerald-600' : 'text-gray-400'}
                                        `} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            {isDragOver ? 'Drop image here' : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            PNG, JPG, GIF up to 5MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
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
