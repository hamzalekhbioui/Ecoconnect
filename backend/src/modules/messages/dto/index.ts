import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({ description: 'Conversation ID' })
    @IsUUID()
    conversationId: string;

    @ApiProperty({ description: 'Message content' })
    @IsString()
    @MaxLength(5000)
    content: string;

    @ApiPropertyOptional({ description: 'Attachment URL' })
    @IsOptional()
    @IsString()
    attachmentUrl?: string;

    @ApiPropertyOptional({ description: 'Attachment type', enum: ['image', 'document'] })
    @IsOptional()
    @IsEnum(['image', 'document'])
    attachmentType?: 'image' | 'document';
}
