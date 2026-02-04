import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { QuizDifficulty } from '@prisma/client';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import FormData from 'form-data';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QuizzesService {
    private quizServiceUrl: string;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) {
        this.quizServiceUrl = this.config.get('QUIZ_SERVICE_URL') || 'http://localhost:9001';
    }

    async generateQuiz(
        userId: string,
        file: Express.Multer.File,
        dto: CreateQuizDto,
    ) {
        try {
            // Save file to upload folder temporarily
            const uploadDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, `${Date.now()}-${file.originalname}`);
            fs.writeFileSync(filePath, file.buffer);

            // Call quiz service using axios
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('count', dto.count.toString());
            formData.append('difficulty', dto.difficulty.toLowerCase());

            const response = await axios.post(`${this.quizServiceUrl}/generate`, formData, {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });

            // Cleanup temp file
            fs.unlinkSync(filePath);

            const result = response.data;

            if (!result.success) {
                throw new BadRequestException(result.error?.message || 'Quiz generation failed');
            }

            // Save quiz to database
            const quiz = await this.prisma.quiz.create({
                data: {
                    userId,
                    subject: dto.subject,
                    fileName: file.originalname,
                    fileHash: result.data.file_hash,
                    fileUrl: '', // Empty for now, file is stored in quiz_service
                    questions: result.data.questions,
                    difficulty: dto.difficulty,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
            });

            // console.log('[QuizService] Created quiz:', JSON.stringify(quiz, null, 2));

            return {
                ...quiz,
                cached: result.data.cached,
                metadata: result.data.metadata,
            };
        } catch (error) {
            // Cleanup temp file if exists
            const uploadDir = path.join(process.cwd(), 'uploads');
            try {
                const files = fs.readdirSync(uploadDir);
                // Cleanup old temp files (older than 1 hour)
            } catch (e) { }

            if (error instanceof BadRequestException) {
                throw error;
            }

            // Handle axios errors
            if (error.response) {
                // Quiz service returned an error
                const errorData = error.response.data;
                console.error('[QuizService] Error from quiz service:', errorData);
                throw new BadRequestException(
                    errorData?.error?.message || errorData?.message || 'Quiz generation failed'
                );
            }

            console.error('[QuizService] Error:', error.message);
            throw new BadRequestException(`Failed to generate quiz: ${error.message}`);
        }
    }

    async findAll(userId: string) {
        const quizzes = await this.prisma.quiz.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { attempts: true },
                },
            },
        });

        // Calculate stats for each quiz
        return Promise.all(
            quizzes.map(async (quiz) => {
                const attempts = await this.prisma.quizAttempt.findMany({
                    where: { quizId: quiz.id, userId },
                    select: { score: true },
                });

                const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
                const avgScore =
                    attempts.length > 0
                        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
                        : null;

                return {
                    ...quiz,
                    attemptCount: attempts.length,
                    bestScore,
                    avgScore,
                };
            }),
        );
    }

    async findOne(id: string, userId: string) {
        console.log(`[QuizService] findOne called with id="${id}", userId="${userId}"`);

        const quiz = await this.prisma.quiz.findFirst({
            where: { id, userId },
            include: {
                attempts: {
                    where: { userId },
                    orderBy: { completedAt: 'desc' },
                    take: 5,
                },
            },
        });

        console.log(`[QuizService] findOne result: ${quiz ? 'Found' : 'NOT FOUND'}`);

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        return quiz;
    }

    async submitQuiz(userId: string, quizId: string, dto: SubmitQuizDto) {
        // Verify quiz exists and belongs to user
        const quiz = await this.prisma.quiz.findFirst({
            where: { id: quizId, userId },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        // Calculate score
        const questions = quiz.questions as any[];
        const totalCount = questions.length;

        if (dto.answers.length !== totalCount) {
            throw new BadRequestException(
                `Expected ${totalCount} answers, got ${dto.answers.length}`,
            );
        }

        let correctCount = 0;
        for (let i = 0; i < totalCount; i++) {
            if (dto.answers[i] === questions[i].correct_answer) {
                correctCount++;
            }
        }

        const score = Math.round((correctCount / totalCount) * 100);

        // Save attempt
        const attempt = await this.prisma.quizAttempt.create({
            data: {
                quizId,
                userId,
                answers: dto.answers,
                score,
                correctCount,
                totalCount,
            },
            include: {
                quiz: {
                    select: {
                        id: true,
                        subject: true,
                        fileName: true,
                        questions: true,
                    },
                },
            },
        });

        return attempt;
    }

    async getAttempt(attemptId: string, userId: string) {
        const attempt = await this.prisma.quizAttempt.findFirst({
            where: { id: attemptId, userId },
            include: {
                quiz: {
                    select: {
                        id: true,
                        subject: true,
                        fileName: true,
                        questions: true,
                        difficulty: true,
                    },
                },
            },
        });

        if (!attempt) {
            throw new NotFoundException('Attempt not found');
        }

        return attempt;
    }

    async deleteQuiz(id: string, userId: string) {
        const quiz = await this.prisma.quiz.findFirst({
            where: { id, userId },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        await this.prisma.quiz.delete({
            where: { id },
        });

        return { message: 'Quiz deleted successfully' };
    }
}
