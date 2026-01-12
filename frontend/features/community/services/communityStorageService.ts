import { supabase } from '../../../config/supabase';

/**
 * Upload a community cover image to the community-covers bucket.
 * Files are stored with the pattern: {userId}/{timestamp}_{filename}
 * 
 * @param file - The image file to upload
 * @param userId - The user's ID (used as folder path)
 * @returns The public URL of the uploaded image
 */
export const uploadCommunityCover = async (
    file: File,
    userId: string
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

    // Generate collision-free filename: {userId}/{timestamp}_{originalFilename}
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}_${sanitizedFilename}`;

    console.log('[uploadCommunityCover] Uploading file:', {
        originalName: file.name,
        path: filePath,
        size: file.size
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('community-covers')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('[uploadCommunityCover] Upload error:', error);
        throw new Error(`Failed to upload cover image: ${error.message}`);
    }

    console.log('[uploadCommunityCover] Upload successful:', data.path);

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
        .from('community-covers')
        .getPublicUrl(data.path);

    return urlData.publicUrl;
};

/**
 * Delete a community cover image from storage.
 * 
 * @param filePath - The full path to the file in the bucket
 */
export const deleteCommunityCover = async (filePath: string): Promise<void> => {
    const { error } = await supabase.storage
        .from('community-covers')
        .remove([filePath]);

    if (error) {
        console.error('[deleteCommunityCover] Delete error:', error);
        throw new Error(`Failed to delete cover image: ${error.message}`);
    }
};
