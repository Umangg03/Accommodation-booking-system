import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { Location } from './entities/location.entity';
import { Accommodation } from '../accommodations/entities/accommodation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([Location, Accommodation])],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
