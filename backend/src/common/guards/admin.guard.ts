import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedRequest } from './jwt-auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
