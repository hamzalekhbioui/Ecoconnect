import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsNumber, MaxLength, Min } from 'class-validator';

export type EventLocationType = 'online' | 'in_person' | 'hybrid';

export class CreateEventDto {
    @ApiProperty({ description: 'Community ID' })
    @IsUUID()
    communityId: string;

    @ApiProperty({ description: 'Event title' })
    @IsString()
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({ description: 'Event description' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @ApiProperty({ description: 'Start time (ISO 8601)' })
    @IsDateString()
    startTime: string;

    @ApiPropertyOptional({ description: 'End time (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiProperty({ description: 'Location type', enum: ['online', 'in_person', 'hybrid'] })
    @IsEnum(['online', 'in_person', 'hybrid'])
    locationType: EventLocationType;

    @ApiPropertyOptional({ description: 'Meeting link for online events' })
    @IsOptional()
    @IsString()
    meetingLink?: string;

    @ApiPropertyOptional({ description: 'Physical address for in-person events' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Cover image URL' })
    @IsOptional()
    @IsString()
    coverImage?: string;

    @ApiPropertyOptional({ description: 'Maximum number of attendees' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxAttendees?: number;
}

export class UpdateEventDto {
    @ApiPropertyOptional({ description: 'Event title' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @ApiPropertyOptional({ description: 'Event description' })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @ApiPropertyOptional({ description: 'Start time (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    startTime?: string;

    @ApiPropertyOptional({ description: 'End time (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    endTime?: string;

    @ApiPropertyOptional({ description: 'Location type', enum: ['online', 'in_person', 'hybrid'] })
    @IsOptional()
    @IsEnum(['online', 'in_person', 'hybrid'])
    locationType?: EventLocationType;

    @ApiPropertyOptional({ description: 'Meeting link' })
    @IsOptional()
    @IsString()
    meetingLink?: string;

    @ApiPropertyOptional({ description: 'Physical address' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ description: 'Cover image URL' })
    @IsOptional()
    @IsString()
    coverImage?: string;

    @ApiPropertyOptional({ description: 'Maximum attendees' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    maxAttendees?: number;
}

export class EventQueryDto {
    @ApiPropertyOptional({ description: 'Filter by community ID' })
    @IsOptional()
    @IsUUID()
    communityId?: string;

    @ApiPropertyOptional({ description: 'Only upcoming events', default: false })
    @IsOptional()
    upcoming?: boolean;

    @ApiPropertyOptional({ description: 'Limit results', default: 20 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;
}
