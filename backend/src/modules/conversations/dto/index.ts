import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConversationDto {
    @ApiProperty({ description: 'User ID to start conversation with' })
    @IsUUID()
    userId: string;
}
