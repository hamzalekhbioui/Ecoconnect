import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional({ description: 'User role', enum: ['admin', 'member', 'visitor'] })
    @IsOptional()
    @IsEnum(['admin', 'member', 'visitor'])
    role?: 'admin' | 'member' | 'visitor';

    @ApiPropertyOptional({ description: 'User status', enum: ['pending', 'approved'] })
    @IsOptional()
    @IsEnum(['pending', 'approved'])
    status?: 'pending' | 'approved';

    @ApiPropertyOptional({ description: 'User credits' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    credits?: number;
}

export class UserQueryDto {
    @ApiPropertyOptional({ description: 'Search by name or email' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by status', enum: ['pending', 'approved'] })
    @IsOptional()
    @IsEnum(['pending', 'approved'])
    status?: string;

    @ApiPropertyOptional({ description: 'Filter by role', enum: ['admin', 'member', 'visitor'] })
    @IsOptional()
    @IsEnum(['admin', 'member', 'visitor'])
    role?: string;

    @ApiPropertyOptional({ description: 'Limit results', default: 50 })
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

export class UpdateReportStatusDto {
    @ApiProperty({ description: 'New report status', enum: ['resolved', 'dismissed'] })
    @IsEnum(['resolved', 'dismissed'])
    status: 'resolved' | 'dismissed';
}

export class ReportQueryDto {
    @ApiPropertyOptional({ description: 'Filter by status', enum: ['pending', 'reviewed', 'resolved', 'dismissed'] })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ description: 'Limit results', default: 50 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;
}
