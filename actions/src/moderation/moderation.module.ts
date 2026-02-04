import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ViolationDetectionService } from './violation-detection.service';
import { WarningResetService } from './warning-reset.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ModerationController],
  providers: [ModerationService, ViolationDetectionService, WarningResetService],
  exports: [ViolationDetectionService, ModerationService],
})
export class ModerationModule { }


