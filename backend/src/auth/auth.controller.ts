import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  signIn(@Body() body: SignInRequest) {
    
    if (!body.email) {
      throw new BadRequestException('Provide exactly one of id or email');
    }

    return this.authService.signIn(body.email, body.password, body.companyId);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenRequest) {
    return this.authService.refreshTokens(body.id, body.refresh_token);
  }
}
