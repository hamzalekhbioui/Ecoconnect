import {
    Controller,
    Post,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadBucket } from './dto';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common';

@ApiTags('upload')
@Controller('api/upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('community-cover')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload a community cover image' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded successfully' })
    async uploadCommunityCover(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadFile('community-covers', file, user.id);
    }

    @Post('post-media')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload post media (image)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded successfully' })
    async uploadPostMedia(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadFile('post-media', file, user.id);
    }

    @Post('chat-attachment')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload a chat attachment' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'File uploaded successfully' })
    async uploadChatAttachment(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.uploadService.uploadFile('chat-attachments', file, user.id);
    }

    @Delete(':bucket/:path(*)')
    @ApiOperation({ summary: 'Delete a file from storage' })
    @ApiParam({ name: 'bucket', description: 'Storage bucket name' })
    @ApiParam({ name: 'path', description: 'File path in bucket' })
    @ApiResponse({ status: 200, description: 'File deleted' })
    async deleteFile(
        @Param('bucket') bucket: UploadBucket,
        @Param('path') path: string,
    ) {
        await this.uploadService.deleteFile(bucket, path);
        return { message: 'File deleted successfully' };
    }
}
