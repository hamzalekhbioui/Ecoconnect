import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, MaxLength, IsNumber, Min } from 'class-validator';

export class CreatePostDto {
    @ApiProperty({ description: 'Community ID' })
    @IsUUID()
    communityId: string;

    @ApiProperty({ description: 'Post content' })
    @IsString()
    @MaxLength(5000)
    content: string;

    @ApiPropertyOptional({ description: 'Media URL (image/video)' })
    @IsOptional()
    @IsString()
    mediaUrl?: string;

    @ApiPropertyOptional({ description: 'Media type', enum: ['image', 'video'] })
    @IsOptional()
    @IsEnum(['image', 'video'])
    mediaType?: 'image' | 'video';
}

export class CreateCommentDto {
    @ApiProperty({ description: 'Comment content' })
    @IsString()
    @MaxLength(2000)
    content: string;

    @ApiPropertyOptional({ description: 'Parent comment ID for nested replies' })
    @IsOptional()
    @IsUUID()
    parentId?: string;
}

export class PostQueryDto {
    @ApiPropertyOptional({ description: 'Filter by community ID' })
    @IsOptional()
    @IsUUID()
    communityId?: string;

    @ApiPropertyOptional({ description: 'Filter by author ID' })
    @IsOptional()
    @IsUUID()
    authorId?: string;

    @ApiPropertyOptional({ description: 'Limit results', default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    offset?: number;
}

export class ModerationActionDto {
    @ApiProperty({ description: 'Moderation action', enum: ['approve', 'reject'] })
    @IsEnum(['approve', 'reject'])
    action: 'approve' | 'reject';
}
