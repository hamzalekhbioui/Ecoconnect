import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export class UploadResponseDto {
    @ApiProperty({ description: 'Public URL of the uploaded file' })
    url: string;

    @ApiProperty({ description: 'File path in storage' })
    path: string;
}

export type UploadBucket = 'community-covers' | 'post-media' | 'chat-attachments';
