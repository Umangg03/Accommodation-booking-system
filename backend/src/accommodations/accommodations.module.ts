import { Module } from '@nestjs/common';
import { AccommodationsService } from './accommodations.service';
import { AccommodationsController } from './accommodations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accommodation } from './entities/accommodation.entity';
import { AccommodationType } from './entities/accommodation_type.entity';
import { Location } from '../location/entities/location.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Accommodation,
      AccommodationType,
      Location,
      Booking,
    ]),
    JwtModule.register({}),
  ],
  controllers: [AccommodationsController],
  providers: [AccommodationsService, AccessTokenGuard, AdminRoleGuard],
})
export class AccommodationsModule {}
