import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty, IsNumber } from "class-validator"

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    roleId: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    email: string
}
