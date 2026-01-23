import {
    Controller,
    Get,
    Patch,
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
import { AdminReportsService } from './admin-reports.service';
import { UpdateReportStatusDto, ReportQueryDto } from './dto';
import { JwtAuthGuard, AdminGuard } from '../../common';

@ApiTags('admin')
@Controller('api/admin/reports')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminReportsController {
    constructor(private readonly adminReportsService: AdminReportsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all reports (admin only)' })
    @ApiResponse({ status: 200, description: 'Returns list of reports' })
    @ApiResponse({ status: 403, description: 'Admin access required' })
    async findAll(@Query() query: ReportQueryDto) {
        return this.adminReportsService.findAll(query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get report statistics (admin only)' })
    @ApiResponse({ status: 200, description: 'Returns report stats' })
    async getStats() {
        return this.adminReportsService.getStats();
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update report status (admin only)' })
    @ApiParam({ name: 'id', description: 'Report ID' })
    @ApiResponse({ status: 200, description: 'Report updated' })
    @ApiResponse({ status: 404, description: 'Report not found' })
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateReportStatusDto,
    ) {
        return this.adminReportsService.updateStatus(id, dto);
    }
}
