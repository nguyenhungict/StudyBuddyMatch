import { IsArray, ArrayMinSize, ArrayMaxSize, IsInt, Min, Max } from 'class-validator';

export class SubmitQuizDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(20)
    @IsInt({ each: true })
    @Min(0, { each: true })
    @Max(3, { each: true })
    answers: number[];
}
