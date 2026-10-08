import { IsString, IsNotEmpty, IsNumber } from "class-validator";
export class CreateLocationDto {
    @IsNumber()@IsNotEmpty()
    id: number;

    @IsString()
    @IsNotEmpty()
    area: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    country: string;

    @IsNumber()@IsNotEmpty()
    locationId: number;
}
