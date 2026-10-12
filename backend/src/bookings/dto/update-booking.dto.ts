import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminBookingDto } from './create-admin-booking.dto';

export class UpdateBookingDto extends PartialType(CreateAdminBookingDto) {}
