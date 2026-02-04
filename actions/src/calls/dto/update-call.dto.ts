import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCallDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @Type(() => Date)
    acceptedAt?: Date;

    @IsOptional()
    @Type(() => Date)
    endedAt?: Date;

    @IsOptional()
    @IsInt()
    duration?: number;

    @IsOptional()
    @IsString()
    endedById?: string;
}
