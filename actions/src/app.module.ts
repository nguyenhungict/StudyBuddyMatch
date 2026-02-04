import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './auth/auth.module';
import { ModerationModule } from './moderation/moderation.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ResourceModule } from './resource/resource.module';
import { UploadModule } from './upload/upload.module';
// import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { SwipesModule } from './swipes/swipes.module';
import { MatchesModule } from './matches/matches.module';
import { CallsModule } from './calls/calls.module';
import { QuizzesModule } from './quizzes/quizzes.module';

console.log("onfig.get('MAIL_HOST')", process.env.MAIL_USER)
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(), // Enable cron jobs

    // --- CẤU HÌNH GỬI MAIL (GIỮ NGUYÊN) ---
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: process.env.MAIL_HOST,
          secure: false,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD,
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
      }),
    }),
    PrismaModule,
    // LoggerMiddleware,
    AuthModule,
    UsersModule,
    SwipesModule,
    MatchesModule,

    NotificationsModule,
    // AuthModule,
    ModerationModule,
    ReportsModule,
    AdminModule,
    ConversationsModule,
    MessagesModule,
    ResourceModule,
    UploadModule,
    CallsModule,
    QuizzesModule,
  ],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule { }
