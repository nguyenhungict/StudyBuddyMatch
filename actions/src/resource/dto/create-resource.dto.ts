import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateResourceDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    subject?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    grade?: string;
}
