import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizzesController {
    constructor(private readonly quizzesService: QuizzesService) { }

    @Post('generate')
    @UseInterceptors(FileInterceptor('file'))
    async generate(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateQuizDto,
        @Request() req,
    ) {
        console.log(`[Quizzes] Received generate request. File: ${file?.originalname}, Size: ${file?.size}`);
        if (!file) {
            console.error('[Quizzes] No file uploaded');
            throw new BadRequestException('No file uploaded');
        }

        // Convert count to number if it's a string
        if (typeof dto.count === 'string') {
            dto.count = parseInt(dto.count, 10);
        }

        return this.quizzesService.generateQuiz(req.user.id, file, dto);
    }

    @Get()
    findAll(@Request() req) {
        return this.quizzesService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
        return this.quizzesService.findOne(id, req.user.id);
    }

    @Post(':id/submit')
    submitQuiz(
        @Param('id') id: string,
        @Body() dto: SubmitQuizDto,
        @Request() req,
    ) {
        return this.quizzesService.submitQuiz(req.user.id, id, dto);
    }

    @Get('attempts/:attemptId')
    getAttempt(@Param('attemptId') attemptId: string, @Request() req) {
        return this.quizzesService.getAttempt(attemptId, req.user.id);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.quizzesService.deleteQuiz(id, req.user.id);
    }
}
