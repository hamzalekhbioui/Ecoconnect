import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface CreatePostWidgetProps {
    onPost: (content: string, mediaFile?: File) => Promise<void>;
    userAvatar?: string;
    userName?: string;
    disabled?: boolean;
}

export const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({
    onPost,
    userAvatar,
    userName = 'User',
    disabled = false,
}) => {
    const [content, setContent] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type (images only)
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            setMediaFile(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() && !mediaFile) return;

        setIsSubmitting(true);
        try {
            await onPost(content.trim(), mediaFile || undefined);
            // Reset form
            setContent('');
            removeMedia();
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canPost = (content.trim() || mediaFile) && !isSubmitting && !disabled;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex gap-3">
                {/* User Avatar */}
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt={userName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-emerald-600">person</span>
                    </div>
                )}

                <div className="flex-1">
                    {/* Text Area */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share something with the community..."
                        disabled={disabled || isSubmitting}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all min-h-[80px] disabled:opacity-50"
                        rows={3}
                    />

                    {/* Media Preview */}
                    {mediaPreview && (
                        <div className="relative mt-3 inline-block">
                            <img
                                src={mediaPreview}
                                alt="Upload preview"
                                className="max-h-48 rounded-lg object-cover"
                            />
                            <button
                                onClick={removeMedia}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-colors"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            {/* Image Upload */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="post-media-upload"
                                disabled={disabled || isSubmitting}
                            />
                            <label
                                htmlFor="post-media-upload"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${disabled || isSubmitting
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">image</span>
                                Photo
                            </label>
                        </div>

                        {/* Post Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!canPost}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${canPost
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Posting...
                                </span>
                            ) : (
                                'Post'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
