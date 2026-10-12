import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  IsArray,
  IsInt,
  IsOptional,
  ArrayUnique,
  Min,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @Matches(/^[+()\d\s-]{7,20}$/)
  phone: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  companyIds?: number[];
}
