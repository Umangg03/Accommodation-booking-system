import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateAccommodationDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price_per_night: number;

  @IsInt()
  @Min(1)
  accommodationTypeId: number;

  @IsInt()
  @Min(1)
  locationId: number;
}
