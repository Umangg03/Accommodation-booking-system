import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './entities/booking_status.entity';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Customers } from '../customers/entities/customer.entity';
import { Company } from '../companies/entities/company.entity';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingStatus,
      Accommodation,
      Customers,
      Company,
    ]),
    JwtModule.register({}),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, AccessTokenGuard],
})
export class BookingsModule {}
