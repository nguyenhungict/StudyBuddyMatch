import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum ContentType {
    MESSAGE = 'message',
    COMMENT = 'comment',
    POST = 'post',
}

export class ScanContentDto {
    @ApiProperty({
        description: 'Content to scan for violations',
        example: 'This is a test message',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        description: 'Type of content being scanned',
        enum: ContentType,
        required: false,
        default: ContentType.MESSAGE,
    })
    @IsEnum(ContentType)
    @IsOptional()
    contentType?: ContentType;

    @ApiProperty({
        description: 'User ID who created the content',
        required: false,
    })
    @IsString()
    @IsOptional()
    userId?: string;
}
