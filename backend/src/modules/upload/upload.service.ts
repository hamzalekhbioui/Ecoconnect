import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UploadBucket } from './dto';

@Injectable()
export class UploadService {
    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Upload a file to a Supabase storage bucket.
     */
    async uploadFile(
        bucket: UploadBucket,
        file: Express.Multer.File,
        userId: string,
    ) {
        const supabase = this.supabaseService.getAdminClient();

        // Validate file type
        const allowedTypes = this.getAllowedTypes(bucket);
        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        }

        // Validate file size (max 5MB for images, 10MB for documents)
        const maxSize = file.mimetype.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${userId}/${timestamp}_${sanitizedName}`;

        // Upload to storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            throw new BadRequestException(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return {
            url: urlData.publicUrl,
            path: data.path,
        };
    }

    /**
     * Delete a file from storage.
     */
    async deleteFile(bucket: UploadBucket, path: string) {
        const supabase = this.supabaseService.getAdminClient();

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            throw new BadRequestException(`Delete failed: ${error.message}`);
        }
    }

    private getAllowedTypes(bucket: UploadBucket): string[] {
        switch (bucket) {
            case 'community-covers':
            case 'post-media':
                return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            case 'chat-attachments':
                return [
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ];
            default:
                return [];
        }
    }
}
