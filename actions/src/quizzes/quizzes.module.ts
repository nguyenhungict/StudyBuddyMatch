import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        MulterModule.register({
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB
            },
        }),
    ],
    controllers: [QuizzesController],
    providers: [QuizzesService],
    exports: [QuizzesService],
})
export class QuizzesModule { }
