import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AccommodationsService } from './accommodations.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';

@Controller('accommodations')
export class AccommodationsController {
  constructor(private readonly accommodationsService: AccommodationsService) {}

  @Get()
  findAll() {
    return this.accommodationsService.findAll();
  }

  @Get('types')
  findAllTypes() {
    return this.accommodationsService.findAllTypes();
  }

  @UseGuards(AccessTokenGuard, AdminRoleGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @Post()
  create(@Body() createAccommodationDto: CreateAccommodationDto) {
    return this.accommodationsService.create(createAccommodationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accommodationsService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard, AdminRoleGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccommodationDto: UpdateAccommodationDto) {
    return this.accommodationsService.update(+id, updateAccommodationDto);
  }

  @UseGuards(AccessTokenGuard, AdminRoleGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accommodationsService.remove(+id);
  }
}
