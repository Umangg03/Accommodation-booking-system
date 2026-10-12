import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { type AuthenticatedRequest } from '../auth/access-token.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @RequirePermission('bookings', 'create')
  @Post()
  create(
    @Body() createBookingDto: CreateAdminBookingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingsService.createForCustomer(
      createBookingDto,
      request.user,
    );
  }

  @RequirePermission('bookings', 'create')
  @Post('admin')
  createForCustomer(
    @Body() createBookingDto: CreateAdminBookingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingsService.createForCustomer(
      createBookingDto,
      request.user,
    );
  }

  @RequirePermission('bookings', 'view')
  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query('companyId') requestedCompanyId?: string,
  ) {
    let companyFilter: number | undefined;
    if (request.user.role?.toUpperCase() === 'ADMIN') {
      if (requestedCompanyId !== undefined) {
        companyFilter = Number(requestedCompanyId);
        if (!Number.isInteger(companyFilter) || companyFilter <= 0) {
          throw new BadRequestException('companyId must be a positive integer.');
        }
      }
    } else {
      companyFilter = request.user.companyId;
    }
    return this.bookingsService.findAll(request.user, companyFilter);
  }

  @RequirePermission('bookings', 'view')
  @Get('statuses')
  findAllStatuses() {
    return this.bookingsService.findAllStatuses();
  }

  @RequirePermission('bookings', 'update')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingsService.update(id, updateBookingDto, request.user);
  }

  @RequirePermission('bookings', 'cancel')
  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingsService.cancel(id, request.user);
  }

  @RequirePermission('bookings', 'confirm')
  @Patch(':id/confirm')
  confirm(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.bookingsService.confirm(id, request.user);
  }
}
