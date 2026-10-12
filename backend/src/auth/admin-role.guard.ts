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
    const role = request.user?.role;

    if (!request.user) {
      throw new UnauthorizedException('Sign in is required.');
    }
    if (role?.toUpperCase() !== 'ADMIN') {
      throw new ForbiddenException('Only admins can perform this action.');
    }
    return true;
  }
}
