import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AccommodationsService } from './accommodations.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';
import { RequirePermission } from '../auth/require-permission.decorator';
import { CreateAccommodationTypeDto } from './dto/create-accommodation-type.dto';
import { UpdateAccommodationTypeDto } from './dto/update-accommodation-type.dto';

@Controller('accommodations')
export class AccommodationsController {
  constructor(private readonly accommodationsService: AccommodationsService) {}

  @RequirePermission('accommodations', 'view')
  @Get()
  findAll() {
    return this.accommodationsService.findAll();
  }

  @RequirePermission('accommodations', 'view')
  @Get('types')
  findAllTypes() {
    return this.accommodationsService.findAllTypes();
  }

  @RequirePermission('accommodations', 'create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @Post('types')
  createType(@Body() createDto: CreateAccommodationTypeDto) {
    return this.accommodationsService.createType(createDto);
  }

  @RequirePermission('accommodations', 'update')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @Patch('types/:id')
  updateType(
    @Param('id') id: string,
    @Body() updateDto: UpdateAccommodationTypeDto,
  ) {
    return this.accommodationsService.updateType(+id, updateDto);
  }

  @RequirePermission('accommodations', 'delete')
  @Delete('types/:id')
  removeType(@Param('id') id: string) {
    return this.accommodationsService.removeType(+id);
  }

  @RequirePermission('accommodations', 'create')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @Post()
  create(@Body() createAccommodationDto: CreateAccommodationDto) {
    return this.accommodationsService.create(createAccommodationDto);
  }

  @RequirePermission('accommodations', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accommodationsService.findOne(+id);
  }

  @RequirePermission('accommodations', 'update')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccommodationDto: UpdateAccommodationDto) {
    return this.accommodationsService.update(+id, updateAccommodationDto);
  }

  @RequirePermission('accommodations', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accommodationsService.remove(+id);
  }
}
