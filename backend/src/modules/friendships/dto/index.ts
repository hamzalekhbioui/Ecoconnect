import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateFriendshipStatusDto {
    @ApiProperty({ description: 'New friendship status', enum: ['accepted', 'rejected'] })
    @IsEnum(['accepted', 'rejected'])
    status: 'accepted' | 'rejected';
}
