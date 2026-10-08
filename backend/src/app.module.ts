import 'dotenv/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users/entities/user.entity';
import { Permission } from './users/entities/permission.entity';
import { Role } from './users/entities/role.entity';
import { CompaniesModule } from './companies/companies.module';
import { CustomersModule } from './customers/customers.module';
import { AccommodationsModule } from './accommodations/accommodations.module';
import { AccommodationType } from './accommodations/entities/accommodation_type.entity';
import { BookingsModule } from './bookings/bookings.module';
import { Customers } from './customers/entities/customer.entity';
import { Company } from './companies/entities/company.entity';
import { Booking } from './bookings/entities/booking.entity';
import { LocationModule } from './location/location.module';
import { Accommodation } from './accommodations/entities/accommodation.entity';
import { Location } from './location/entities/location.entity';
import { BookingStatus } from './bookings/entities/booking_status.entity';
import { AuthModule } from './auth/auth.module';
import { AuthUser } from './auth/entities/auth.user.entity';
// import { InitialAdminAndCompany1791430000000 } from './initial-admin-company.migration';



@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: 'Umang#2005',
      database: process.env.DB_NAME,
      entities: [Users, Permission, Role, Customers, Company, Booking, Accommodation, AccommodationType, Location, BookingStatus, AuthUser],
      // migrations: [InitialAdminAndCompany1791430000000],
      synchronize: true,
      autoLoadEntities: true,
    }),
    UsersModule, CompaniesModule, CustomersModule, AccommodationsModule, BookingsModule, LocationModule, AuthModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
