import { api } from '../../../config/api';

/**
 * Extract filename from a URL.
 */
export const getFilenameFromUrl = (url: string): string => {
    try {
        const pathname = new URL(url).pathname;
        const filename = pathname.split('/').pop() || 'file';
        // Remove timestamp prefix if present (e.g., "1234567890_filename.pdf" -> "filename.pdf")
        const parts = filename.split('_');
        if (parts.length > 1 && /^\d+$/.test(parts[0])) {
            return parts.slice(1).join('_');
        }
        return filename;
    } catch {
        return 'file';
    }
};

// Supported file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate and upload an attachment to the backend.
 * 
 * @param file - The file to upload
 * @returns Object with the public URL and file type
 */
export const uploadAttachment = async (
    file: File
): Promise<{ url: string; type: 'image' | 'document' }> => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 10MB');
    }

    // Determine file type
    let fileType: 'image' | 'document';
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        fileType = 'image';
    } else if (ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
        fileType = 'document';
    } else {
        throw new Error('Unsupported file type. Please upload an image or document.');
    }

    const result = await api.uploadFile('/api/upload/chat-attachment', file);

    return {
        url: result.url,
        type: fileType,
    };
};

/**
 * Delete an attachment from storage.
 * 
 * @param filePath - The path to the file in storage
 */
export const deleteAttachment = async (filePath: string): Promise<void> => {
    await api.delete(`/api/upload/chat-attachments/${encodeURIComponent(filePath)}`);
};
