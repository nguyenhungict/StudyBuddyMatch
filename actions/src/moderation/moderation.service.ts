import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ViolationDetectionService, ViolationResult } from './violation-detection.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly violationDetection: ViolationDetectionService,
    private readonly notifications: NotificationsService,
  ) { }

  /**
   * Scan and create moderation record for content
   * This will be used when DB is available
   */
  async scanAndCreateModeration(
    content: string,
    contentType: 'message' | 'comment' | 'post',
    targetId: string,
    reporterId?: string,
  ) {
    const scanResult = this.violationDetection.scanContent(content, contentType);

    if (!scanResult.hasViolation) {
      return null;
    }

    // When DB is available, uncomment this:
    /*
    const moderation = await this.prisma.moderation.create({
      data: {
        type: scanResult.violations[0].type,
        source: reporterId ? 'USER_REPORT' : 'SYSTEM_SCAN',
        targetId,
        reporterId,
        reason: `Detected ${scanResult.violations.length} violation(s)`,
        status: 'PENDING',
        violationCount: scanResult.violations.length,
        ...(contentType === 'message' && { messageId: targetId }),
        ...(contentType === 'comment' && { commentId: targetId }),
        ...(contentType === 'post' && { postId: targetId }),
      },
    });

    return moderation;
    */

    // For now, return mock data
    return {
      id: 'mock-id',
      type: scanResult.violations[0].type,
      source: reporterId ? 'USER_REPORT' : 'SYSTEM_SCAN',
      targetId,
      reporterId,
      status: 'PENDING',
      violationCount: scanResult.violations.length,
      scanResult,
    };
  }

  /**
   * Get moderation records (mock for now)
   */
  async getModerations(filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) {
    // When DB is available, uncomment this:
    /*
    return this.prisma.moderation.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        target: true,
        reporter: true,
        reviewer: true,
      },
    });
    */

    // Mock data for now
    return [];
  }

  /**
   * Review and resolve moderation
   */
  async reviewModeration(
    moderationId: string,
    reviewerId: string,
    action: 'WARN' | 'BAN' | 'DELETE_CONTENT' | 'NONE',
    note?: string,
    banDuration?: 1 | 3 | 7,
  ) {
    console.log('📝 [ReviewModeration] Starting review:', {
      moderationId,
      reviewerId,
      action,
      note,
      banDuration,
    });

    // Update moderation record
    const updated = await this.prisma.moderation.update({
      where: { id: moderationId },
      data: {
        status: 'RESOLVED',
        action,
        reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        target: true,
        reporter: true,
        reviewer: true,
      },
    });

    console.log('✅ [ReviewModeration] Moderation updated successfully');

    // Create moderation log
    await this.prisma.moderationLog.create({
      data: {
        moderationId,
        adminId: reviewerId,
        action,
        note,
      },
    });

    console.log('✅ [ReviewModeration] Moderation log created');

    // Apply action to user if needed
    if (action === 'WARN' || action === 'BAN') {
      await this.applyModerationAction(updated.targetId, action, banDuration);
    }

    // Send notifications
    await this.sendReviewNotifications(updated, action, note);

    return updated;
  }

  /**
   * Apply moderation action to user
   */
  private async applyModerationAction(
    userId: string,
    action: 'WARN' | 'BAN' | 'DELETE_CONTENT' | 'NONE',
    banDuration?: 1 | 3 | 7,
  ) {
    console.log('⚡ [ApplyAction] Applying action to user:', { userId, action });

    if (action === 'WARN') {
      // Increment warn count and check if auto-ban needed
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { warnCount: true, lastViolationAt: true },
      });

      if (!user) return;

      const now = new Date();
      const lastViolation = user.lastViolationAt;
      const daysSinceLastViolation = lastViolation
        ? (now.getTime() - lastViolation.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      // Reset warn count if more than 30 days since last violation
      const newWarnCount = daysSinceLastViolation > 30 ? 1 : user.warnCount + 1;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          warnCount: newWarnCount,
          lastViolationAt: now,
        },
      });

      console.log('⚠️  [ApplyAction] User warned, warn count:', newWarnCount);

      // Auto-ban if 3 warnings
      if (newWarnCount >= 3) {
        console.log('🚫 [ApplyAction] Auto-banning user due to 3 warnings');
        await this.applyModerationAction(userId, 'BAN');
      }
    } else if (action === 'BAN') {
      // Use admin-specified ban duration or calculate based on ban count
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { banCount: true, warnCount: true },
      });

      if (!user) return;

      const banCount = user.banCount + 1;

      // Use admin-specified duration if provided, otherwise auto-calculate
      let banDays: number;
      if (banDuration) {
        banDays = banDuration;
        console.log('🎯 [ApplyAction] Using admin-specified ban duration:', banDays, 'days');
      } else {
        // Auto-calculate based on ban count (for progressive punishment from warnings)
        const banDurations = [1, 3, 7]; // days: 1st ban = 1 day, 2nd = 3 days, 3rd+ = 7 days
        banDays = banDurations[Math.min(banCount - 1, banDurations.length - 1)];
        console.log('🔄 [ApplyAction] Auto-calculated ban duration:', banDays, 'days (ban count:', banCount, ')');
      }

      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + banDays);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          banCount,
          bannedUntil,
          lastViolationAt: new Date(),
          // Reset warn count when banned
          warnCount: 0,
        },
      });

      console.log('🚫 [ApplyAction] User banned until:', bannedUntil, 'Ban count:', banCount, 'Duration:', banDays, 'days');
    }
  }

  /**
   * Send notifications to reporter and target user
   */
  private async sendReviewNotifications(
    moderation: any,
    action: 'WARN' | 'BAN' | 'DELETE_CONTENT' | 'NONE',
    note?: string,
  ) {
    console.log('📧 [SendNotifications] Sending review notifications');

    // Notification to reporter (thank them for reporting)
    if (moderation.reporterId) {
      const reporterContent = action === 'NONE'
        ? 'Thank you for your report. After review, we found no violation of our community guidelines.'
        : `Thank you for your report. We have taken action: ${this.getActionText(action)}. Your help keeps our community safe.`;

      await this.notifications.createNotification(
        moderation.reporterId,
        'MODERATION_RESOLVED',
        reporterContent,
      );
      console.log('✅ [SendNotifications] Notification sent to reporter');
    }

    // Notification to target user (inform them of action)
    if (action !== 'NONE') {
      const targetContent = await this.getTargetNotificationContent(
        action,
        moderation.targetId,
        note,
      );

      await this.notifications.createNotification(
        moderation.targetId,
        'MODERATION_ACTION',
        targetContent,
      );
      console.log('✅ [SendNotifications] Notification sent to target user');
    }
  }

  /**
   * Get action text for notifications
   */
  private getActionText(action: string): string {
    switch (action) {
      case 'WARN':
        return 'Warning issued';
      case 'BAN':
        return 'User banned';
      case 'DELETE_CONTENT':
        return 'Content deleted';
      default:
        return 'No action taken';
    }
  }

  /**
   * Get notification content for target user
   */
  private async getTargetNotificationContent(
    action: string,
    targetId: string,
    note?: string,
  ): Promise<string> {
    let content = '';

    // Get user data for context
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { warnCount: true, banCount: true, bannedUntil: true },
    });

    switch (action) {
      case 'WARN':
        const warnCount = user?.warnCount || 0;
        content = `🚨 **OFFICIAL WARNING ${warnCount}/3**: You have received a formal warning for violating our community guidelines.`;

        if (warnCount === 1) {
          content += ' This is your first warning. Please be more careful.';
        } else if (warnCount === 2) {
          content += ' ⚠️ **IMPORTANT**: This is your second warning. One more warning will result in an automatic temporary ban.';
        } else if (warnCount >= 3) {
          content += ' ⛔ **FINAL WARNING**: You have reached 3 warnings and will be automatically banned.';
        }
        break;

      case 'BAN':
        const bannedUntil = user?.bannedUntil;
        const banCount = user?.banCount || 0;

        if (bannedUntil) {
          const banEndDate = new Date(bannedUntil).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          content = `⛔ **ACCOUNT SUSPENDED**: Your account has been temporarily banned until **${banEndDate}** for violating our community guidelines.`;

          if (banCount === 1) {
            content += ' This is your first ban.';
          } else if (banCount === 2) {
            content += ' This is your second ban. Future violations may result in longer bans.';
          } else {
            content += ` This is ban #${banCount}. Repeated violations may result in permanent suspension.`;
          }
        } else {
          content = '⛔ **ACCOUNT SUSPENDED**: Your account has been temporarily banned for violating our community guidelines.';
        }
        break;

      case 'DELETE_CONTENT':
        content = '🗑️ **CONTENT REMOVED**: Your content has been removed for violating our community guidelines.';
        break;
    }

    if (note) {
      content += `\n\n**Reason**: ${note}`;
    }

    content += '\n\nPlease review our community guidelines to avoid future violations. Repeated violations may result in permanent account suspension.';

    return content;
  }
}

