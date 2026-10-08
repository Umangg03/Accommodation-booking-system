import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './access-token.guard';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const roles = request.user?.roles;
    const role = typeof roles === 'string' ? roles : roles?.role;

    if (!request.user) {
      throw new UnauthorizedException('Sign in is required.');
    }
    if (role?.toLowerCase() !== 'admin') {
      throw new ForbiddenException('Only admins can manage accommodations.');
    }
    return true;
  }
}
