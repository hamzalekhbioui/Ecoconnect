import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { UpdateUserDto, UserQueryDto } from './dto';
import { JwtAuthGuard, AdminGuard } from '../../common';

@ApiTags('admin')
@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminUsersController {
    constructor(private readonly adminUsersService: AdminUsersService) { }

    @Get()
    @ApiOperation({ summary: 'Get all users (admin only)' })
    @ApiResponse({ status: 200, description: 'Returns list of users' })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    async findAll(@Query() query: UserQueryDto) {
        return this.adminUsersService.findAll(query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get user statistics (admin only)' })
    @ApiResponse({ status: 200, description: 'Returns user stats' })
    async getStats() {
        return this.adminUsersService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a user by ID (admin only)' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'Returns the user' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findById(@Param('id') id: string) {
        return this.adminUsersService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a user (admin only)' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User updated' })
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.adminUsersService.update(id, dto);
    }

    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve a pending user (admin only)' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User approved' })
    async approve(@Param('id') id: string) {
        return this.adminUsersService.approve(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete/reject a user (admin only)' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User deleted' })
    async reject(@Param('id') id: string) {
        await this.adminUsersService.reject(id);
        return { message: 'User deleted successfully' };
    }
}
