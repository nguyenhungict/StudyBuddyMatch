import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export enum ReportType {
  SPAM = 'SPAM',
  HATE_SPEECH = 'HATE_SPEECH',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SCAM = 'SCAM',
  FAKE_INFORMATION = 'FAKE_INFORMATION',
  OTHER = 'OTHER',
}

export enum ReportTargetType {
  MESSAGE = 'MESSAGE',
  COMMENT = 'COMMENT',
  POST = 'POST',
  USER = 'USER',
  RESOURCE = 'RESOURCE',
}

export class CreateReportDto {
  @ApiProperty({
    description: 'Type of report',
    enum: ReportType,
    example: ReportType.SPAM,
  })
  @IsEnum(ReportType)
  @IsNotEmpty()
  type: ReportType;

  @ApiProperty({
    description: 'Type of target being reported',
    enum: ReportTargetType,
    example: ReportTargetType.MESSAGE,
  })
  @IsEnum(ReportTargetType)
  @IsNotEmpty()
  targetType: ReportTargetType;

  @ApiProperty({
    description: 'ID of the target being reported (UUID for PostgreSQL entities, ObjectId for MongoDB messages)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'Reason for reporting',
    example: 'This message contains inappropriate content',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({
    description: 'Additional details about the report',
    example: 'The user sent multiple spam messages',
    required: false,
  })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiProperty({
    description: 'User ID of the person being reported (required for MESSAGE reports from MongoDB)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  reportedUserId?: string;
}