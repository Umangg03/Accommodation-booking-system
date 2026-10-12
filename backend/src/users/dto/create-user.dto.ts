import {
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsIn,
    ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CompanyRoleDto {
    @IsInt()
    companyId: number;

    @IsIn(["ADMIN", "MANAGER", "USER"])
    role: "ADMIN" | "MANAGER" | "USER";
}

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

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CompanyRoleDto)
    companyRoles?: CompanyRoleDto[];
}
    