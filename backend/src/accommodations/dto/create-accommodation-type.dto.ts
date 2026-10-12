import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAccommodationTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
