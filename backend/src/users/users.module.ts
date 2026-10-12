import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Company } from '../companies/entities/company.entity';
import { CompanyMembership } from './entities/company-membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Role, Company, CompanyMembership]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
