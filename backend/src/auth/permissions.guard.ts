import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './access-token.guard';
import { REQUIRED_PERMISSION_KEY } from './require-permission.decorator';
import { IS_PUBLIC_KEY } from './public.decorator';
import { can, normalizeRole, type Action, type Resource } from './permissions';

interface RequiredPermission {
  resource: Resource;
  action: Action;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = normalizeRole(request.user?.role);
    if (!role) {
      throw new ForbiddenException('A valid company role is required.');
    }

    const permission = this.reflector.getAllAndOverride<RequiredPermission>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    return !permission || can(role, permission.resource, permission.action);
  }
}
