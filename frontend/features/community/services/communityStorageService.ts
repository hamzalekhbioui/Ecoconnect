import { api } from '../../../config/api';

/**
 * Upload a community cover image to the backend.
 * 
 * @param file - The image file to upload
 * @param _userId - The user's ID (not needed anymore, backend handles this)
 * @returns The public URL of the uploaded image
 */
export const uploadCommunityCover = async (
    file: File,
    _userId: string
): Promise<string> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
    }

    const result = await api.uploadFile('/api/upload/community-cover', file);
    return result.url;
};

/**
 * Delete a community cover image from storage.
 * 
 * @param filePath - The full path to the file in the bucket
 */
export const deleteCommunityCover = async (filePath: string): Promise<void> => {
    await api.delete(`/api/upload/community-covers/${encodeURIComponent(filePath)}`);
};
