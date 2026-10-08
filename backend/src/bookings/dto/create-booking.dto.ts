import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @Min(1)
  accommodationId: number;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+()\d\s-]{7,20}$/)
  phone: string;
}
