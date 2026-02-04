import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateReportDto {
    @ApiProperty({
        description: 'Updated reason for reporting',
        example: 'This message contains spam content',
        required: false,
    })
    @IsString()
    @IsOptional()
    reason?: string;

    @ApiProperty({
        description: 'Updated additional details about the report',
        example: 'The user sent multiple spam messages in a short time',
        required: false,
    })
    @IsString()
    @IsOptional()
    details?: string;
}
