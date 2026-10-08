import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import type { AuthenticatedRequest } from '../auth/access-token.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(AccessTokenGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingsService.create(createBookingDto, request.user);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.bookingsService.findAll(request.user);
  }

}
