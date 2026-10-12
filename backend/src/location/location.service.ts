import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Repository } from 'typeorm';
import { Accommodation } from '../accommodations/entities/accommodation.entity';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
  ) {}

  async create(createLocationDto: CreateLocationDto) {
    const location = this.locationRepository.create(createLocationDto);
    return this.locationRepository.save(location);
  }

  async findAll() {
    return this.locationRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location With ID ${id} Not Found`);
    }
    return location;
  }

  async update(id: number, updateLocationDto: UpdateLocationDto) {
    const location = await this.findOne(id);
    Object.assign(location, updateLocationDto);
    return this.locationRepository.save(location);
  }

  async remove(id: number) {
    const location = await this.findOne(id)
    const accommodationCount = await this.accommodationRepository.count({
      where: { location: { id } },
    });
    if (accommodationCount > 0) {
      throw new BadRequestException(
        'A location used by accommodations cannot be deleted.',
      );
    }
    return this.locationRepository.remove(location);
  }
}
