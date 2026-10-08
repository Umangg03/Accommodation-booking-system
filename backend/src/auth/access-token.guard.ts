import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AccessTokenPayload {
  sub: number;
  username: string;
  name: string;
  companyId: number;
  roles?: string | { role?: string };
}

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('A bearer access token is required.');
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_ACCESS_SECRET must be configured',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token, { secret });
      if (
        !Number.isInteger(payload.sub) ||
        !Number.isInteger(payload.companyId) ||
        typeof payload.username !== 'string' ||
        typeof payload.name !== 'string'
      ) {
        throw new UnauthorizedException('Invalid access token.');
      }
      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}
