import { supabase } from '../../../config/supabase';

export type AttachmentType = 'image' | 'document';

/**
 * Upload a file attachment to the chat-attachments bucket.
 * Files are stored with the pattern: {conversationId}/{timestamp}_{filename}
 * 
 * @param file - The file to upload
 * @param conversationId - The conversation ID (used as folder path for RLS)
 * @returns Object containing the public URL and attachment type
 */
export const uploadAttachment = async (
    file: File,
    conversationId: string
): Promise<{ url: string; type: AttachmentType }> => {
    // Determine attachment type based on MIME type
    const type: AttachmentType = file.type.startsWith('image/') ? 'image' : 'document';

    // Generate collision-free filename: {conversationId}/{timestamp}_{originalFilename}
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${conversationId}/${timestamp}_${sanitizedFilename}`;

    console.log('[uploadAttachment] Uploading file:', {
        originalName: file.name,
        path: filePath,
        type,
        size: file.size
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('[uploadAttachment] Upload error:', error);
        throw new Error(`Failed to upload attachment: ${error.message}`);
    }

    console.log('[uploadAttachment] Upload successful:', data.path);

    // Create a signed URL for the file (valid for 1 hour)
    // This is required for private buckets
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(data.path, 3600); // 3600 seconds = 1 hour

    if (signedUrlError || !signedUrlData) {
        console.error('[uploadAttachment] Signed URL error:', signedUrlError);
        // Fallback to public URL if signed URL fails
        const { data: urlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(data.path);
        return {
            url: urlData.publicUrl,
            type,
        };
    }

    return {
        url: signedUrlData.signedUrl,
        type,
    };
};

/**
 * Delete an attachment from storage.
 * 
 * @param filePath - The full path to the file in the bucket
 */
export const deleteAttachment = async (filePath: string): Promise<void> => {
    const { error } = await supabase.storage
        .from('chat-attachments')
        .remove([filePath]);

    if (error) {
        console.error('[deleteAttachment] Delete error:', error);
        throw new Error(`Failed to delete attachment: ${error.message}`);
    }
};

/**
 * Extract filename from attachment URL.
 */
export const getFilenameFromUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const filename = pathParts[pathParts.length - 1];
        // Remove timestamp prefix (format: {timestamp}_{filename})
        const underscoreIndex = filename.indexOf('_');
        return underscoreIndex > 0 ? filename.substring(underscoreIndex + 1) : filename;
    } catch {
        return 'attachment';
    }
};
