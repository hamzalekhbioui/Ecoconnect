import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';

@Module({
    controllers: [AdminUsersController, AdminReportsController],
    providers: [AdminUsersService, AdminReportsService],
    exports: [AdminUsersService, AdminReportsService],
})
export class AdminModule { }
