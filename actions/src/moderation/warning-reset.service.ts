import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarningResetService {
    private readonly logger = new Logger(WarningResetService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Reset warnings for users who haven't violated in 30+ days
     * Runs daily at 00:00
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetExpiredWarnings() {
        this.logger.log('🔄 Starting warning reset job...');

        try {
            // Calculate date 30 days ago
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Find users who need warning reset
            const usersToReset = await this.prisma.user.findMany({
                where: {
                    warnCount: { gt: 0 }, // Has warnings
                    lastViolationAt: {
                        lt: thirtyDaysAgo, // Last violation > 30 days ago
                    },
                },
                select: {
                    id: true,
                    email: true,
                    warnCount: true,
                    lastViolationAt: true,
                },
            });

            if (usersToReset.length === 0) {
                this.logger.log('✅ No users need warning reset');
                return;
            }

            // Reset warnings for eligible users
            const result = await this.prisma.user.updateMany({
                where: {
                    id: { in: usersToReset.map((u) => u.id) },
                },
                data: {
                    warnCount: 0,
                },
            });

            this.logger.log(
                `✅ Reset warnings for ${result.count} users (${usersToReset.map((u) => u.email).join(', ')})`,
            );
        } catch (error) {
            this.logger.error('❌ Error resetting warnings:', error);
        }
    }

    /**
     * Manual trigger for testing (can be called via API endpoint if needed)
     */
    async manualResetWarnings() {
        this.logger.log('🔧 Manual warning reset triggered');
        await this.resetExpiredWarnings();
    }
}
