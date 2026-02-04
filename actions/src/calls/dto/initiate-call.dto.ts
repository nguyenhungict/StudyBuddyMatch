import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class InitiateCallDto {
    @IsNotEmpty()
    @IsString()
    callerId: string;

    @IsNotEmpty()
    @IsString()
    recipientId: string;

    @IsNotEmpty()
    @IsEnum(['AUDIO', 'VIDEO'])
    callType: 'AUDIO' | 'VIDEO';
}
