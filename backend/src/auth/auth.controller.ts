import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

class SignInRequest {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  companyId?: number;
}

class RefreshTokenRequest {
  @IsInt()
  @Min(1)
  id: number;

  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

class ResetPasswordRequest {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  @MinLength(8)
  confirmPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @Public()
  signIn(@Body() body: SignInRequest) {
    
    if (!body.email) {
      throw new BadRequestException('Provide exactly one of id or email');
    }

    return this.authService.signIn(body.email, body.password, body.companyId);
  }

  @Post('refresh')
  @Public()
  refresh(@Body() body: RefreshTokenRequest) {
    return this.authService.refreshTokens(body.id, body.refresh_token);
  }

  @Post('forgot-password')
  @Public()
  resetPassword(@Body() body: ResetPasswordRequest) {
    return this.authService.resetPassword(
      body.email,
      body.currentPassword,
      body.newPassword,
      body.confirmPassword,
    );
  }
}
