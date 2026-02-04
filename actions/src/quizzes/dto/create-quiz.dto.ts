import { IsString, IsInt, Min, Max, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { QuizDifficulty } from '@prisma/client';

export class CreateQuizDto {
    @IsString()
    @IsNotEmpty()
    subject: string;

    @Type(() => Number)
    @IsInt()
    @Min(10)
    @Max(20)
    count: number;

    @IsEnum(QuizDifficulty)
    difficulty: QuizDifficulty;
}
