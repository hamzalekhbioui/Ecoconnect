import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, AuthenticatedUser } from '../guards/jwt-auth.guard';

/**
 * Custom decorator to extract the authenticated user from the request.
 * 
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return this.service.getProfile(user.id);
 * }
 * 
 * // Or get specific property
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) {
 *   return this.service.getProfile(userId);
 * }
 */
export const CurrentUser = createParamDecorator(
    (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = request.user;

        if (!user) {
            return null;
        }

        return data ? user[data] : user;
    },
);
