import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, MaxLength, Min } from 'class-validator';

export class CreateListingDto {
    @ApiProperty({ description: 'Listing title' })
    @IsString()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({ description: 'Listing description' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @ApiProperty({ description: 'Category', enum: ['plants', 'seeds', 'tools', 'produce', 'services', 'other'] })
    @IsEnum(['plants', 'seeds', 'tools', 'produce', 'services', 'other'])
    category: string;

    @ApiPropertyOptional({ description: 'Price (null for free items)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional({ description: 'Image URL' })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'Location' })
    @IsOptional()
    @IsString()
    location?: string;
}

export class UpdateListingDto {
    @ApiPropertyOptional({ description: 'Listing title' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @ApiPropertyOptional({ description: 'Listing description' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @ApiPropertyOptional({ description: 'Category' })
    @IsOptional()
    @IsEnum(['plants', 'seeds', 'tools', 'produce', 'services', 'other'])
    category?: string;

    @ApiPropertyOptional({ description: 'Price' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @ApiPropertyOptional({ description: 'Image URL' })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'Location' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Status', enum: ['active', 'sold', 'removed'] })
    @IsOptional()
    @IsEnum(['active', 'sold', 'removed'])
    status?: string;
}

export class ListingQueryDto {
    @ApiPropertyOptional({ description: 'Filter by category' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Search query' })
    @IsOptional()
    @IsString()
    search?: string;

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
