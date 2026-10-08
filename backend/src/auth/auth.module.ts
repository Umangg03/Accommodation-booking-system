import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthUser } from './entities/auth.user.entity';

@Module({
  imports: [UsersModule, JwtModule.register({}), TypeOrmModule.forFeature([AuthUser])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
