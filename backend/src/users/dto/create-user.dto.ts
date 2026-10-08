import {
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
} from "class-validator";
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsOptional()
    @IsInt()
    roleId?: number;

    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    companyIds: number[];
}
    