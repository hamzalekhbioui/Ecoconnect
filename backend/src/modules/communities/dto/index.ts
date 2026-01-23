import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, MinLength, MaxLength } from 'class-validator';

export class CreateCommunityDto {
    @ApiProperty({ description: 'Community name', example: 'Urban Gardeners' })
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ description: 'Community description' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({ description: 'Cover image URL' })
    @IsOptional()
    @IsString()
    coverImage?: string;

    @ApiPropertyOptional({ description: 'Whether posts require approval', default: false })
    @IsOptional()
    @IsBoolean()
    requiresPostApproval?: boolean;

    @ApiPropertyOptional({ description: 'Whether membership requires approval', default: false })
    @IsOptional()
    @IsBoolean()
    requiresMembershipApproval?: boolean;
}

export class UpdateCommunityDto {
    @ApiPropertyOptional({ description: 'Community name' })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ description: 'Community description' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({ description: 'Cover image URL' })
    @IsOptional()
    @IsString()
    coverImage?: string;

    @ApiPropertyOptional({ description: 'Whether posts require approval' })
    @IsOptional()
    @IsBoolean()
    requiresPostApproval?: boolean;

    @ApiPropertyOptional({ description: 'Whether membership requires approval' })
    @IsOptional()
    @IsBoolean()
    requiresMembershipApproval?: boolean;
}

export class JoinCommunityDto {
    @ApiPropertyOptional({ description: 'Optional message for join request' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    message?: string;
}

export class UpdateMemberStatusDto {
    @ApiProperty({ description: 'New member status', enum: ['approved', 'rejected'] })
    @IsEnum(['approved', 'rejected'])
    status: 'approved' | 'rejected';
}

export class CommunityQueryDto {
    @ApiPropertyOptional({ description: 'Search query' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Limit results', default: 20 })
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
    @IsOptional()
    offset?: number;
}
