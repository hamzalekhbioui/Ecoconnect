import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: string;
    accessToken: string;
}

export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly supabaseService: SupabaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            const result = await this.supabaseService.verifyToken(token);

            if (!result) {
                throw new UnauthorizedException('Invalid or expired token');
            }

            // Attach user info to request
            request.user = {
                id: result.user.id,
                email: result.user.email,
                role: result.user.role || 'member',
                accessToken: token,
            };

            return true;
        } catch (error) {
            throw new UnauthorizedException('Token verification failed');
        }
    }
}
