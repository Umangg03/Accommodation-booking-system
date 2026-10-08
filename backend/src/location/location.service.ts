import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LocationService {

  constructor(@InjectRepository(Location)
      private locationRepositry : Repository<Location>
){}

  async create(createLocationDto: CreateLocationDto) {
    const location = this.locationRepositry.create(createLocationDto)
    return await this.locationRepositry.save(location);
  }

  async findAll() {
    return await this.locationRepositry.find({
      order:{
        id:"ASC"
      }
    })
  }

  async findOne(id: number) {
    const location = await this.locationRepositry.findOne({where : {id}})
    if(!location){
      throw new NotFoundException(`Location With ID ${id} Not Found`)
    }
    return location;
  } 

  async update(id: number, updateLocationDto: UpdateLocationDto) {
    const location = await this.findOne(id)
    Object.assign(location,updateLocationDto)
    return await this.locationRepositry.save(location);
  }

  async remove(id: number) {
    const location = await this.findOne(id)
    return await this.locationRepositry.remove(location);
  }
}
