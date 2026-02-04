import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNotEmpty, IsIn, IsNumber } from 'class-validator';

export enum ModerationAction {
  WARN = 'WARN',
  BAN = 'BAN',
  DELETE_CONTENT = 'DELETE_CONTENT',
  NONE = 'NONE',
}

export class ReviewModerationDto {
  @ApiProperty({
    description: 'Action to take on the moderation',
    enum: ModerationAction,
    example: ModerationAction.WARN,
  })
  @IsEnum(ModerationAction)
  @IsNotEmpty()
  action: ModerationAction;

  @ApiProperty({
    description: 'Optional note for the review',
    example: 'Content violates community guidelines',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    description: 'Ban duration in days (required when action is BAN)',
    enum: [1, 3, 7],
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsIn([1, 3, 7])
  banDuration?: 1 | 3 | 7;
}


