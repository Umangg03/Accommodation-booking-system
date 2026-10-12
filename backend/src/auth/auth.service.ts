import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUser } from './entities/auth.user.entity.js';
import { Repository } from 'typeorm';
import * as dotenv from 'dotenv'
import { normalizeRole } from './permissions';
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
      const superCompanyName = process.env.COMPANY_NAME?.trim();
      const superCompany = superCompanyName
        ? companies.find(
            (assignedCompany) =>
              assignedCompany.name.trim().toLowerCase() ===
              superCompanyName.toLowerCase(),
          )
        : undefined;
      if (superCompany) {
        const superCompanyRole = normalizeRole(
          await this.usersService.findCompanyRole(user.id, superCompany.id),
        );
        if (superCompanyRole === 'ADMIN') {
          return this.issueTokens(user, superCompany, superCompanyRole, 'Platform');
        }
      }
      return {
        companies: companies
          .filter(
            ({ name }) =>
              !superCompanyName ||
              name.trim().toLowerCase() !== superCompanyName.toLowerCase(),
          )
          .map(({ id, name }) => ({ id, name })),
      };
    }

    const superCompanyName = process.env.COMPANY_NAME?.trim();
    const company = companies.find(
      (assignedCompany) =>
        assignedCompany.id === companyId &&
        (!superCompanyName ||
          assignedCompany.name.trim().toLowerCase() !==
            superCompanyName.toLowerCase()),
    );
    if (!company) {
      throw new UnauthorizedException('You are not assigned to this company');
    }

    const role = normalizeRole(
      await this.usersService.findCompanyRole(user.id, company.id),
    );
    if (!role) {
      throw new ForbiddenException(
        'The selected company does not have a valid role for this user.',
      );
    }
    return this.issueTokens(user, company, role);
  }

  private async issueTokens(
    user: { id: number; name: string; email: string },
    company: AssignedCompany,
    role: string,
    displayCompanyName = company.name,
  ): Promise<SignInTokens> {
    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      await this.generateTokens(user.id, role, company.id);
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
      company: { id: company.id, name: displayCompanyName },
      role,
      user: { name: user.name, email: user.email },
    };
  }

  async resetPassword(
    email: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match.',
      );
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password.',
      );
    }

    const user = await this.usersService.findByEmail(email);
    if (!user?.password || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException(
        'Unable to reset password. Check your email and current password.',
      );
    }

    await this.usersService.updatePassword(user.id, newPassword);
    const authUser = await this.authUserRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (authUser) {
      authUser.accessToken = null;
      authUser.accessTokenExpires = null;
      authUser.refreshToken = null;
      authUser.refreshTokenExpires = null;
      await this.authUserRepository.save(authUser);
    }
    return { message: 'Password updated successfully.' };
  }

  async refreshTokens(userId: number, providedRefreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const authUser = await this.authUserRepository.findOne({
      where: { user: { id: userId } },
    });

    if (
      !authUser ||
      !authUser.refreshToken ||
      !authUser.refreshTokenExpires
    ) {
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

    const role = normalizeRole(
      await this.usersService.findCompanyRole(user.id, company.id),
    );
    if (!role) {
      throw new UnauthorizedException(
        'User has no valid role in the selected company.',
      );
    }
    const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt } =
      await this.generateTokens(user.id, role, company.id);


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
    role: string,
    companyId: number,
  ) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured');
    }

    const payload = {
      sub: userId,
      companyId,
      role,
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