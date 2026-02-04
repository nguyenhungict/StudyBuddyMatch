import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSwipeDto {
  @ApiProperty({
    description: 'ID của user được swipe (target)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: 'true nếu like, false nếu pass',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  like: boolean;
}


