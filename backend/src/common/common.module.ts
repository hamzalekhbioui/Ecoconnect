import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Module({
    imports: [SupabaseModule],
    providers: [JwtAuthGuard, AdminGuard],
    exports: [SupabaseModule, JwtAuthGuard, AdminGuard],
})
export class CommonModule { }
