import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateAdminBookingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  companyId?: number;

  @IsInt()
  @Min(1)
  customerId: number;

  @IsInt()
  @Min(1)
  accommodationId: number;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  statusId?: number;
}
