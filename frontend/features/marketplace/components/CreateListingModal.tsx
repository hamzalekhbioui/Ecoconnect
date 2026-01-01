import React, { useState } from 'react';
import { X, Save, Loader2, Upload, ImagePlus } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface CreateListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Category = 'SKILL' | 'DOCUMENT' | 'SERVICE' | 'CONTACT' | 'PROJECT' | 'TOOL';

const CATEGORIES: { value: Category; label: string }[] = [
    { value: 'SKILL', label: 'Skill' },
    { value: 'DOCUMENT', label: 'Document' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'CONTACT', label: 'Contact' },
    { value: 'PROJECT', label: 'Project' },
    { value: 'TOOL', label: 'Tool' },
];

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<string>('');
    const [category, setCategory] = useState<Category>('SKILL');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            setUploadingImage(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
            const filePath = `listings/${fileName}`;

            console.log('Uploading to path:', filePath);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('marketplace-images')
                .upload(filePath, file);

            console.log('Upload result:', { uploadData, uploadError });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('marketplace-images')
                .getPublicUrl(filePath);

            console.log('Public URL:', data.publicUrl);

            return data.publicUrl;
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Image upload failed. Check if the storage bucket exists.');
            return null;
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError(null);
        setSaving(true);

        try {
            let imageUrl: string | null = null;

            // Upload image if provided
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }

            // Insert listing
            const { error: insertError } = await supabase
                .from('marketplace_listings')
                .insert({
                    title,
                    description,
                    price: price ? parseFloat(price) : null,
                    category,
                    image_url: imageUrl,
                    user_id: user.id,
                });

            if (insertError) {
                throw insertError;
            }

            // Reset form
            setTitle('');
            setDescription('');
            setPrice('');
            setCategory('SKILL');
            setImageFile(null);
            setImagePreview(null);

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error creating listing:', err);
            setError('Failed to create listing. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPrice('');
        setCategory('SKILL');
        setImageFile(null);
        setImagePreview(null);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Create Listing</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image
                        </label>
                        <div className="relative">
                            {imagePreview ? (
                                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                                    >
                                        <X className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                                    <ImagePlus className="w-10 h-10 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Click to upload image</span>
                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="What are you offering?"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            placeholder="Describe your listing in detail..."
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as Category)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price (€) <span className="text-gray-400 font-normal">- leave empty for free</span>
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || uploadingImage || !title || !description}
                            className="flex-1 px-4 py-2.5 bg-[#13ec5b] hover:bg-[#0fd64f] text-gray-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving || uploadingImage ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {uploadingImage ? 'Uploading...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create Listing
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
