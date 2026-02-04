import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { ViolationDetectionService } from '../moderation/violation-detection.service';
import { ReviewModerationDto, ModerationAction } from './dto/review-moderation.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
    private readonly violationDetection: ViolationDetectionService,
  ) { }

  /**
   * Get all moderation reports with filters
   */
  async getModerationReports(filters: {
    status?: string;
    type?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.prisma.moderation.findMany({
      where: {
        ...(filters.status && { status: filters.status as any }),
        ...(filters.type && { type: filters.type }),
        ...(filters.source && { source: filters.source }),
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        target: {
          select: {
            id: true,
            email: true,
            isActive: true,
            warnCount: true,
            banCount: true,
            lastViolationAt: true,
            bannedUntil: true,
            profile: true,
          },
        },
        reporter: {
          include: {
            profile: true,
          },
        },
        reviewer: {
          include: {
            profile: true,
          },
        },
        message: true,
      },
    });

    // Mock data (commented out - now using database)
    // return [];
  }

  /**
   * Get moderation report by ID
   */
  async getModerationReportById(reportId: string) {
    const report = await this.prisma.moderation.findUnique({
      where: { id: reportId },
      include: {
        target: {
          select: {
            id: true,
            email: true,
            isActive: true,
            warnCount: true,
            banCount: true,
            lastViolationAt: true,
            bannedUntil: true,
            profile: true,
          },
        },
        reporter: {
          include: {
            profile: true,
          },
        },
        reviewer: {
          include: {
            profile: true,
          },
        },
        message: true,
        logs: {
          include: {
            admin: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Moderation report with ID ${reportId} not found`);
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
   * Review and resolve a moderation report
   */
  async reviewModerationReport(
    reportId: string,
    reviewerId: string,
    reviewDto: ReviewModerationDto,
  ) {
    // Verify reviewer is admin
    const isAdmin = await this.verifyAdmin(reviewerId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can review moderation reports');
    }

    // Get the report
    const report = await this.getModerationReportById(reportId);
    if (!report) {
      throw new NotFoundException(`Moderation report with ID ${reportId} not found`);
    }

    // Review the moderation
    const reviewed = await this.moderationService.reviewModeration(
      reportId,
      reviewerId,
      reviewDto.action,
      reviewDto.note,
      reviewDto.banDuration,
    );

    // Create audit log
    await this.prisma.moderationLog.create({
      data: {
        moderationId: reportId,
        adminId: reviewerId,
        action: reviewDto.action,
        note: reviewDto.note,
      },
    });

    return reviewed;
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(period?: string): Promise<AdminStatsDto> {
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // TODO: Consider caching this data with TTL of 1 hour for better performance
    const [
      pendingReports,
      resolvedReports,
      violationsToday,
      activeUsers,
      reportsByType,
      reportsByStatus,
      // Analytics data
      subjectsData,
      levelsData,
      learningGoalsData,
      studyStylesData,
    ] = await Promise.all([
      this.prisma.moderation.count({
        where: {
          status: 'PENDING',
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.moderation.count({
        where: {
          status: 'RESOLVED',
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.moderation.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.user.count({
        where: { isActive: true },
      }),
      this.prisma.moderation.groupBy({
        by: ['type'],
        _count: true,
        where: {
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.moderation.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: { gte: startDate },
        },
      }),
      // Get popular subjects (optimized query with JOIN)
      this.prisma.profile.groupBy({
        by: ['tagSubjectId'],
        _count: true,
        orderBy: {
          _count: {
            tagSubjectId: 'desc',
          },
        },
      }),
      // Get popular levels
      this.prisma.profile.groupBy({
        by: ['tagLevelId'],
        _count: true,
        orderBy: {
          _count: {
            tagLevelId: 'desc',
          },
        },
      }),
      // Get popular learning goals
      this.prisma.profile.groupBy({
        by: ['tagLearningGoalId'],
        _count: true,
        orderBy: {
          _count: {
            tagLearningGoalId: 'desc',
          },
        },
      }),
      // Get popular study styles
      this.prisma.profile.groupBy({
        by: ['tagStudyStyleId'],
        _count: true,
        orderBy: {
          _count: {
            tagStudyStyleId: 'desc',
          },
        },
      }),
    ]);

    const reportsByTypeMap: Record<string, number> = {};
    reportsByType.forEach((item) => {
      reportsByTypeMap[item.type] = item._count;
    });

    const reportsByStatusMap: Record<string, number> = {};
    reportsByStatus.forEach((item) => {
      reportsByStatusMap[item.status] = item._count;
    });

    // Process analytics data - get tag names and calculate percentages
    const totalProfiles = activeUsers; // Assuming each active user has a profile

    // Helper function to process trend data
    const processTrendData = async (
      data: Array<{ _count: number;[key: string]: any }>,
      tagIdField: string,
      tagModel: any,
    ) => {
      const items = await Promise.all(
        data.map(async (item) => {
          const tagId = item[tagIdField];
          if (!tagId) return null;

          const tag = await tagModel.findUnique({
            where: { id: tagId },
          });

          return {
            name: tag?.name || 'Unknown',
            count: item._count,
            percentage: totalProfiles > 0 ? Math.round((item._count / totalProfiles) * 100) : 0,
          };
        }),
      );

      return items.filter((item) => item !== null);
    };

    const [popularSubjects, popularLevels, popularLearningGoals, popularStudyStyles] =
      await Promise.all([
        processTrendData(subjectsData, 'tagSubjectId', this.prisma.tagSubject),
        processTrendData(levelsData, 'tagLevelId', this.prisma.tagLevel),
        processTrendData(learningGoalsData, 'tagLearningGoalId', this.prisma.tagLearningGoal),
        processTrendData(studyStylesData, 'tagStudyStyleId', this.prisma.tagStudyStyle),
      ]);

    // Calculate user growth data (daily breakdown)
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const userGrowthData = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Count new users created on this day
      const newUsers = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      // Count active users up to this day
      const activeUsers = await this.prisma.user.count({
        where: {
          isActive: true,
          createdAt: {
            lte: dayEnd,
          },
        },
      });

      userGrowthData.push({
        date: dayStart.toISOString().split('T')[0],
        activeUsers,
        newUsers,
      });
    }

    return {
      pendingReports,
      resolvedReports,
      violationsToday,
      activeUsers,
      reportsByType: reportsByTypeMap,
      reportsByStatus: reportsByStatusMap,
      popularSubjects,
      popularLevels,
      popularLearningGoals,
      popularStudyStyles,
      userGrowthData,
    };

    // Mock data (commented out - now using database)
    /*
    return {
      pendingReports: 0,
      resolvedReports: 0,
      violationsToday: 0,
      activeUsers: 0,
      reportsByType: {},
      reportsByStatus: {},
    };
    */
  }

  /**
   * Get user growth data for dashboard charts
   */
  async getUserGrowthData(period: string = '30d') {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily user registrations
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const dailyData = new Map<string, { newUsers: number; activeUsers: number }>();

    users.forEach(user => {
      const dateStr = user.createdAt.toISOString().split('T')[0];
      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, { newUsers: 0, activeUsers: 0 });
      }
      const data = dailyData.get(dateStr)!;
      data.newUsers++;
      if (user.isActive) {
        data.activeUsers++;
      }
    });

    // Fill in missing dates and calculate cumulative active users
    const result = [];
    let cumulativeActiveUsers = await this.prisma.user.count({
      where: {
        createdAt: { lt: startDate },
        isActive: true,
      },
    });

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayData = dailyData.get(dateStr) || { newUsers: 0, activeUsers: 0 };
      cumulativeActiveUsers += dayData.activeUsers;

      result.push({
        date: dateStr,
        newUsers: dayData.newUsers,
        activeUsers: cumulativeActiveUsers,
      });
    }

    return result;
  }

  /**
   * Get users with pagination and filters
   */
  async getUsers(filters: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const { page, limit, search, role, isActive } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get total count and users
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          profile: {
            select: {
              username: true,
              gender: true,
              birthday: true,
              school: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        profile: {
          include: {
            tagSubject: true,
            tagLevel: true,
            tagGender: true,
            tagStudyStyle: true,
            tagLearningGoal: true,
            tagStudyDay: true,
            tagStudyTime: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Ban a user (permanent ban from User Management)
   */
  async banUser(id: string, reason?: string, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { email: true } });

    // Create moderation record for audit trail
    const moderation = await this.prisma.moderation.create({
      data: {
        targetId: id,
        reporterId: adminId || id, // Use admin as reporter for system actions
        type: 'OTHER',
        source: 'ADMIN_ACTION',
        status: 'RESOLVED',
        reviewerId: adminId,
        reviewedAt: new Date(),
      },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        bannedUntil: null, // null = permanent ban
        warnCount: 0,
        banCount: 0,
        lastViolationAt: new Date(),
      },
    });

    // Create audit log
    if (adminId) {
      await this.prisma.moderationLog.create({
        data: {
          moderationId: moderation.id,
          adminId: adminId,
          action: 'BAN',
          note: reason || 'Permanent ban from User Management',
        },
      });
    }

    console.log(`🔨 [AUDIT] Admin ${adminId || 'SYSTEM'} PERMANENTLY BANNED user ${user?.email} (${id}). Reason: ${reason || 'No reason provided'}`);
  }

  /**
   * Unban a user
   */
  async unbanUser(id: string, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { email: true } });

    // Create moderation record for audit trail
    const moderation = await this.prisma.moderation.create({
      data: {
        targetId: id,
        reporterId: adminId || id,
        type: 'OTHER',
        source: 'ADMIN_ACTION',
        status: 'RESOLVED',
        reviewerId: adminId,
        reviewedAt: new Date(),
      },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        bannedUntil: null,
      },
    });

    // Create audit log
    if (adminId) {
      await this.prisma.moderationLog.create({
        data: {
          moderationId: moderation.id,
          adminId: adminId,
          action: 'NONE', // Unban is technically "no action" - just reverting
          note: 'User unbanned from User Management',
        },
      });
    }

    console.log(`✅ [AUDIT] Admin ${adminId || 'SYSTEM'} UNBANNED user ${user?.email} (${id})`);
  }

  /**
   * Manage violation keywords - Using PostgreSQL database with type filtering
   */
  async addViolationKeyword(type: string, keyword: string) {
    // Create keyword with type in database
    await this.prisma.violationKeyword.create({
      data: {
        text: keyword.toLowerCase().trim(),
        type: type,
      },
    });

    return {
      success: true,
      message: 'Violation keyword added successfully',
    };
  }

  async removeViolationKeyword(type: string, keyword: string) {
    // Delete keyword from database by text AND type
    await this.prisma.violationKeyword.deleteMany({
      where: {
        text: keyword.toLowerCase().trim(),
        type: type,
      },
    });

    return {
      success: true,
      message: 'Violation keyword removed successfully',
    };
  }

  async getViolationKeywords(type?: string) {
    // Fetch keywords filtered by type if provided
    const where = type ? { type } : {};

    const keywords = await this.prisma.violationKeyword.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by type if no specific type requested
    if (!type) {
      const grouped: Record<string, any[]> = {};
      keywords.forEach((k) => {
        if (!grouped[k.type]) grouped[k.type] = [];
        grouped[k.type].push({ id: k.id, text: k.text, createdAt: k.createdAt });
      });
      return {
        success: true,
        data: grouped,
      };
    }

    // Return array for specific type
    return {
      success: true,
      data: keywords.map((k) => ({
        id: k.id,
        text: k.text,
        createdAt: k.createdAt,
      })),
    };
  }

  // ==================== DOCUMENTS MANAGEMENT ====================

  async getAllDocuments(page = 1, limit = 20, status?: string) {
    const where: any = status ? { status } : {};

    const [documents, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      success: true,
      data: documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDocumentById(id: string) {
    const document = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      success: true,
      data: document,
    };
  }

  async getDocumentReports(status?: string) {
    const where: any = {
      source: 'RESOURCE',
    };

    if (status) {
      where.status = status;
    }

    const reports = await this.prisma.moderation.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
              },
            },
          },
        },
        target: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: reports,
    };
  }

  async deleteDocument(id: string) {
    const document = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from database
    await this.prisma.resource.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }


  /**
   * Verify if user is admin
   */
  private async verifyAdmin(userId: string): Promise<boolean> {
    console.log('🔍 [verifyAdmin] Checking userId:', userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    console.log('👤 [verifyAdmin] User found:', user ? {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name
    } : 'NOT FOUND');

    const isAdmin = user?.role?.name === 'ADMIN';
    console.log('✅ [verifyAdmin] Is admin?', isAdmin);

    return isAdmin;
  }
}

