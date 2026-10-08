import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUser } from './entities/auth.user.entity.js';
import { Repository } from 'typeorm';
import * as dotenv from 'dotenv'
dotenv.config();

export interface AssignedCompany {
  id: number;
  name: string;
}

export interface SignInTokens {
  access_token: string;
  refresh_token: string;
  company: AssignedCompany;
  role: string;
  user: {
    name: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(AuthUser)
    private readonly authUserRepository: Repository<AuthUser>,
  ) {}

  async signIn(
    email: string,
    pass: string,
    companyId?: number,
  ): Promise<{ companies: AssignedCompany[] } | SignInTokens> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const companies = user.companies ?? [];
    if (companyId === undefined) {
      return {
        companies: companies.map(({ id, name }) => ({ id, name })),
      };
    }

    const company = companies.find((assignedCompany) => assignedCompany.id === companyId);
    if (!company) {
      throw new UnauthorizedException('You are not assigned to this company');
    }

    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      await this.generateTokens(
        user.id,
        user.email,
        user.name,
        user.role,
        company.id,
      );


    let authUser = await this.authUserRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (!authUser) {
      authUser = this.authUserRepository.create({ user });
    }

    authUser.accessToken = accessToken;
    authUser.accessTokenExpires = accessExpiresAt;
    authUser.refreshToken = refreshToken;
    authUser.refreshTokenExpires = refreshExpiresAt;
    authUser.selectedCompanyId = company.id;

    await this.authUserRepository.save(authUser);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      company: { id: company.id, name: company.name },
      role: user.role?.role ?? 'User',
      user: { name: user.name, email: user.email },
    };
  }

  async refreshTokens(userId: number, providedRefreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const authUser = await this.authUserRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!authUser || !authUser.refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }


    if (new Date() > new Date(authUser.refreshTokenExpires)) {
      throw new UnauthorizedException('Refresh token has expired');
    }


    const isRefreshTokenValid = await bcrypt.compare(
      providedRefreshToken,
      authUser.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const company = user.companies.find(
      (assignedCompany) => assignedCompany.id === authUser.selectedCompanyId,
    );
    if (!company) {
      throw new UnauthorizedException('User is no longer assigned to this company');
    }

    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      await this.generateTokens(
        user.id,
        user.email,
        user.name,
        user.role,
        company.id,
      );


    authUser.accessToken = accessToken;
    authUser.accessTokenExpires = accessExpiresAt;
    authUser.refreshToken = refreshToken;
    authUser.refreshTokenExpires = refreshExpiresAt;

    await this.authUserRepository.save(authUser);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async generateTokens(
    userId: number,
    email: string,
    name: string,
    role: unknown,
    companyId: number,
  ) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured');
    }

    const payload = {
      sub: userId,
      username: email,
      name,
      roles: role,
      companyId,
    };

    const accessExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '60m', secret: accessSecret }),
      this.jwtService.signAsync(payload, { expiresIn: '7d', secret: refreshSecret }),
    ]);

    return {
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
    };
  }
}