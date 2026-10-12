import { IsString, IsNotEmpty } from "class-validator";
export class CreateLocationDto {
    @IsString()
    @IsNotEmpty()
    area: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    country: string;
}
