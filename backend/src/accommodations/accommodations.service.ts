import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Location } from '../location/entities/location.entity';
import { Accommodation } from './entities/accommodation.entity';
import { AccommodationType } from './entities/accommodation_type.entity';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';

@Injectable()
export class AccommodationsService {
  constructor(
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
    @InjectRepository(AccommodationType)
    private readonly typeRepository: Repository<AccommodationType>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  findAll() {
    return this.accommodationRepository.find({
      relations: { accommodation_type: true, location: true },
      order: { id: 'ASC' },
    });
  }

  findAllTypes() {
    return this.typeRepository.find({ order: { id: 'ASC' } });
  }

  async create(createDto: CreateAccommodationDto) {
    const [accommodationType, location] = await Promise.all([
      this.findType(createDto.accommodationTypeId),
      this.findLocation(createDto.locationId),
    ]);

    const accommodation = this.accommodationRepository.create({
      description: createDto.description.trim(),
      price_per_night: createDto.price_per_night,
      accommodation_type: accommodationType,
      location,
    });
    return this.accommodationRepository.save(accommodation);
  }

  async findOne(id: number) {
    const accommodation = await this.accommodationRepository.findOne({
      where: { id },
      relations: { accommodation_type: true, location: true },
    });
    if (!accommodation) {
      throw new NotFoundException(`Accommodation with id ${id} not found`);
    }
    return accommodation;
  }

  async update(id: number, updateDto: UpdateAccommodationDto) {
    const accommodation = await this.findOne(id);

    if (updateDto.description !== undefined) {
      accommodation.description = updateDto.description.trim();
    }
    if (updateDto.price_per_night !== undefined) {
      accommodation.price_per_night = updateDto.price_per_night;
    }
    if (updateDto.accommodationTypeId !== undefined) {
      accommodation.accommodation_type = await this.findType(
        updateDto.accommodationTypeId,
      );
    }
    if (updateDto.locationId !== undefined) {
      accommodation.location = await this.findLocation(updateDto.locationId);
    }

    return this.accommodationRepository.save(accommodation);
  }

  async remove(id: number) {
    const accommodation = await this.findOne(id);
    const bookingCount = await this.bookingRepository.count({
      where: { accommodation: { id } },
    });
    if (bookingCount > 0) {
      throw new BadRequestException(
        'An accommodation with bookings cannot be deleted.',
      );
    }
    await this.accommodationRepository.remove(accommodation);
    return { id };
  }

  private async findType(id: number) {
    const accommodationType = await this.typeRepository.findOneBy({ id });
    if (!accommodationType) {
      throw new NotFoundException(
        `Accommodation type with id ${id} not found`,
      );
    }
    return accommodationType;
  }

  private async findLocation(id: number) {
    const location = await this.locationRepository.findOneBy({ id });
    if (!location) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }
    return location;
  }
}
