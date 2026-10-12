import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingStatus } from './entities/booking_status.entity';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { Customers } from '../customers/entities/customer.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingStatus,
      Accommodation,
      Customers,
      Company,
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
