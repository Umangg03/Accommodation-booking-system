import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service';
import { AuthUser } from './entities/auth.user.entity';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { verifyAsync: jest.Mock; signAsync: jest.Mock };
  let authUserRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    jwtService = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(),
    };
    authUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(async (session) => session),
      create: jest.fn((session) => session),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findOne: jest.fn() },
        },
        { provide: JwtService, useValue: jwtService },
        {
          provide: getRepositoryToken(AuthUser),
          useValue: authUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rotates the refresh token and persists only its hash', async () => {
    const oldRefreshToken = 'old-refresh-token';
    const session = {
      id: 'session-id',
      user: {
        id: 3,
        email: 'guest@example.com',
        role: { role: 'guest' },
      },
      refreshTokenHash: createHash('sha256').update(oldRefreshToken).digest('hex'),
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    };
    authUserRepository.findOne.mockResolvedValue(session);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 3,
      sid: 'session-id',
      tokenType: 'refresh',
    });
    jwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    await expect(service.refreshTokens(oldRefreshToken)).resolves.toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });

    expect(session.refreshTokenHash).toBe(
      createHash('sha256').update('new-refresh-token').digest('hex'),
    );
    expect(authUserRepository.save).toHaveBeenCalledWith(session);
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ tokenType: 'access' }),
      expect.objectContaining({ expiresIn: '15m', secret: 'test-access-secret' }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ tokenType: 'refresh' }),
      expect.objectContaining({ expiresIn: '7d', secret: 'test-refresh-secret' }),
    );
  });

  it('rejects a refresh token that is not the current session token', async () => {
    authUserRepository.findOne.mockResolvedValue({
      id: 'session-id',
      user: { id: 3, email: 'guest@example.com' },
      refreshTokenHash: createHash('sha256').update('different-token').digest('hex'),
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });
    jwtService.verifyAsync.mockResolvedValue({
      sub: 3,
      sid: 'session-id',
      tokenType: 'refresh',
    });

    await expect(service.refreshTokens('provided-token')).rejects.toThrow(
      'Invalid or expired refresh token',
    );
    expect(authUserRepository.save).not.toHaveBeenCalled();
  });
});
