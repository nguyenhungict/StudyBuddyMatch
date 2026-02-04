import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto, ReportType, ReportTargetType } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ViolationDetectionService } from '../moderation/violation-detection.service';
import { ModerationService } from '../moderation/moderation.service';


@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly violationDetection: ViolationDetectionService,
    private readonly moderationService: ModerationService,
  ) { }

  /**
   * Create a new report
   * @param userId - ID of the user creating the report
   * @param createReportDto - Report data
   */
  async createReport(userId: string, createReportDto: CreateReportDto) {
    // Validate that target exists
    const targetExists = await this.validateTargetExists(
      createReportDto.targetType,
      createReportDto.targetId,
    );

    if (!targetExists) {
      throw new NotFoundException(
        `${createReportDto.targetType} with ID ${createReportDto.targetId} not found`,
      );
    }

    // Check if user already reported this target
    const existingReport = await this.checkExistingReport(
      userId,
      createReportDto.targetType,
      createReportDto.targetId,
    );

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }

    // Get content for violation scanning if applicable
    let content = '';
    if (
      createReportDto.targetType === ReportTargetType.MESSAGE ||
      createReportDto.targetType === ReportTargetType.COMMENT ||
      createReportDto.targetType === ReportTargetType.POST ||
      createReportDto.targetType === ReportTargetType.RESOURCE
    ) {
      content = await this.getContentFromTarget(
        createReportDto.targetType,
        createReportDto.targetId,
      );
    }

    // Scan content for violations if content exists
    if (content) {
      const contentType =
        createReportDto.targetType === ReportTargetType.MESSAGE
          ? 'message'
          : createReportDto.targetType === ReportTargetType.COMMENT
            ? 'comment'
            : createReportDto.targetType === ReportTargetType.RESOURCE
              ? 'document' // Use document type for scanning
              : 'post';

      const scanResult = this.violationDetection.scanContent(content, contentType as any);

      // Auto-create moderation if violations detected
      if (scanResult.hasViolation) {
        await this.moderationService.scanAndCreateModeration(
          content,
          contentType as any,
          createReportDto.targetId,
          userId,
        );
      }
    }

    // Create report in database
    const targetUserId = await this.getTargetUserId(
      createReportDto.targetType,
      createReportDto.targetId,
      createReportDto.reportedUserId
    );

    // Append content preview to reason for resources (since we don't have direct relation in DB)
    let reasonText = createReportDto.reason || createReportDto.details;
    if (createReportDto.targetType === ReportTargetType.RESOURCE) {
      // ALWAYS add DocID for resources, even if content is empty
      if (content) {
        reasonText = `[DocID:${createReportDto.targetId}] [Document]: ${content.split('\n')[0].substring(0, 50)}...\nReason: ${reasonText}`;
      } else {
        reasonText = `[DocID:${createReportDto.targetId}] ${reasonText}`;
      }
    }

    console.log('🔍 Debug report creation:', {
      type: createReportDto.type,
      targetType: createReportDto.targetType,
      targetId: createReportDto.targetId,
      targetUserId,
      reporterId: userId,
    });

    const report = await this.prisma.moderation.create({
      data: {
        type: createReportDto.type,
        source: createReportDto.targetType, // Use targetType as source to distinguish resource reports
        targetId: targetUserId,
        reporterId: userId,
        reason: reasonText,
        status: 'PENDING',
      },
    });

    return report;

    // Mock data (commented out - now using database)
    /*
    return {
      id: 'mock-report-id',
      type: createReportDto.type,
      source: 'USER_REPORT',
      targetId: createReportDto.targetId,
      targetType: createReportDto.targetType,
      reporterId: userId,
      reason: createReportDto.reason || createReportDto.details,
      status: 'PENDING',
      createdAt: new Date(),
    };
    */
  }

  /**
   * Get reports by user
   */
  async getUserReports(userId: string) {
    return this.prisma.moderation.findMany({
      where: {
        reporterId: userId,
        source: 'USER_REPORT',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        target: true,
      },
    });

    // Mock data (commented out - now using database)
    // return [];
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string) {
    const report = await this.prisma.moderation.findUnique({
      where: { id: reportId },
      include: {
        target: true,
        reporter: true,
        reviewer: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return report;

    // Mock data (commented out - now using database)
    /*
    return {
      id: reportId,
      status: 'PENDING',
    };
    */
  }

  /**
   * Validate that target exists
   */
  private async validateTargetExists(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<boolean> {
    // When DB is available, implement this:
    /*
    switch (targetType) {
      case ReportTargetType.MESSAGE:
        const message = await this.prisma.message.findUnique({ where: { id: targetId } });
        return !!message;
      case ReportTargetType.COMMENT:
        const comment = await this.prisma.comment.findUnique({ where: { id: targetId } });
        return !!comment;
      case ReportTargetType.POST:
        const post = await this.prisma.communityPost.findUnique({ where: { id: targetId } });
        return !!post;
      case ReportTargetType.USER:
        const user = await this.prisma.user.findUnique({ where: { id: targetId } });
        return !!user;
      default:
        return false;
    }
    */

    // For now, return true (assume exists)
    return true;
  }

  /**
   * Check if user already reported this target
   */
  private async checkExistingReport(
    userId: string,
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<boolean> {
    // When DB is available, implement this:
    /*
    const existing = await this.prisma.moderation.findFirst({
      where: {
        reporterId: userId,
        source: 'USER_REPORT',
        ...(targetType === ReportTargetType.MESSAGE && { messageId: targetId }),
        ...(targetType === ReportTargetType.COMMENT && { commentId: targetId }),
        ...(targetType === ReportTargetType.POST && { postId: targetId }),
        ...(targetType === ReportTargetType.USER && { targetId }),
      },
    });

    return !!existing;
    */

    // For now, return false (no existing report)
    return false;
  }

  private async getContentFromTarget(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string> {
    // Fetch content from database
    switch (targetType) {
      case ReportTargetType.MESSAGE:
        return '';

      case ReportTargetType.RESOURCE:
        const resource = await this.prisma.resource.findUnique({
          where: { id: targetId },
          select: { title: true, description: true },
        });
        return resource ? `${resource.title}\n${resource.description || ''}` : '';

      default:
        // For other types (COMMENT, POST), return empty for now
        return '';
    }
  }

  /**
   * Get target user ID
   */
  private async getTargetUserId(
    targetType: ReportTargetType,
    targetId: string,
    reportedUserId?: string,
  ): Promise<string> {
    switch (targetType) {
      case ReportTargetType.USER:
        // For user reports, targetId IS the user ID
        return targetId;

      case ReportTargetType.MESSAGE:
        // For message reports, use provided reportedUserId (from MongoDB message)
        // Messages are stored in MongoDB (chatserver), not PostgreSQL
        if (reportedUserId) {
          return reportedUserId;
        }
        throw new Error('reportedUserId is required for MESSAGE reports');

      case ReportTargetType.RESOURCE:
        // For resource reports, find the author (uploader)
        const resource = await this.prisma.resource.findUnique({
          where: { id: targetId },
          select: { userId: true },
        });
        if (!resource) {
          throw new NotFoundException('Resource not found');
        }
        return resource.userId;

      default:
        // For other types (COMMENT, POST), return targetId for now
        // These can be implemented when those features are added
        return targetId;
    }
  }

  /**
   * Update a report
   * @param reportId - ID of the report to update
   * @param userId - ID of the user updating the report
   * @param updateDto - Updated report data
   */
  async updateReport(reportId: string, userId: string, updateDto: UpdateReportDto) {
    // Get the report
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    // Verify ownership
    if (report.reporterId !== userId) {
      throw new ForbiddenException('You can only edit your own reports');
    }

    // Check status - only allow editing PENDING reports
    if (report.status !== 'PENDING') {
      throw new BadRequestException('Cannot edit report that has been reviewed');
    }

    // Check time limit - only allow editing within 24 hours
    const hoursSinceCreated = (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated > 24) {
      throw new BadRequestException('Cannot edit report after 24 hours');
    }

    // Update the report
    const updatedReport = await this.prisma.moderation.update({
      where: { id: reportId },
      data: {
        ...(updateDto.reason && { reason: updateDto.reason }),
        ...(updateDto.details && { reason: updateDto.details }), // Note: storing details in reason field
      },
    });

    return updatedReport;
  }

  /**
   * Delete a report
   * @param reportId - ID of the report to delete
   * @param userId - ID of the user deleting the report
   */
  async deleteReport(reportId: string, userId: string) {
    // Get the report
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    // Verify ownership
    if (report.reporterId !== userId) {
      throw new ForbiddenException('You can only delete your own reports');
    }

    // Check status - only allow deleting PENDING reports
    if (report.status !== 'PENDING') {
      throw new BadRequestException('Cannot delete report that has been reviewed');
    }

    // Delete the report
    await this.prisma.moderation.delete({
      where: { id: reportId },
    });

    return {
      success: true,
      message: 'Report deleted successfully',
    };
  }
}


