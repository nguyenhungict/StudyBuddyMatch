import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { MatchesService } from '../matches/matches.service';
import { NotificationsService } from '../notifications/notifications.service';
import axios from 'axios';

@Injectable()
export class SwipesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MatchesService))
    private readonly matchesService: MatchesService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Tạo một swipe mới
   * @param swiperId - ID của user đang swipe
   * @param createSwipeDto - DTO chứa targetId và like
   * @returns Swipe đã tạo
   */
  async create(swiperId: string, createSwipeDto: CreateSwipeDto) {
    const { targetId, like } = createSwipeDto;

    // Không cho phép swipe chính mình
    if (swiperId === targetId) {
      throw new BadRequestException('Không thể swipe chính mình');
    }

    // Kiểm tra target user có tồn tại không
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      throw new NotFoundException('User không tồn tại');
    }

    // Kiểm tra đã swipe user này chưa
    const existingSwipe = await this.prisma.swipe.findUnique({
      where: {
        swiperId_targetId: {
          swiperId,
          targetId,
        },
      },
    });

    if (existingSwipe) {
      throw new ConflictException('Đã swipe user này rồi');
    }

    // Tạo swipe mới
    const swipe = await this.prisma.swipe.create({
      data: {
        swiperId,
        targetId,
        isLike: like
      },
      include: {
        target: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Nếu like = true, tạo notification cho target user
    if (like) {
      await this.notificationsService.createNotification(
        targetId,
        'LIKE',
        `Bạn có một lượt thích mới!`,
      );
    }

    // Kiểm tra mutual match (nếu like = true)
    if (like) {
      const mutualSwipe = await this.prisma.swipe.findUnique({
        where: {
          swiperId_targetId: {
            swiperId: targetId,
            targetId: swiperId,
          },
        },
      });

      // Nếu cả 2 đều like nhau -> có match
      if (mutualSwipe?.isLike) {
        // Tạo match record
        try {
          const match = await this.matchesService.createMatch(
            swiperId,
            targetId,
            swipe.id,
            mutualSwipe.id,
          );

          // Tạo notification MATCH cho cả 2 users
          await this.notificationsService.createNotification(
            swiperId,
            'MATCH',
            `Bạn đã match with ${targetUser.email}!`,
            match.id,
          );

          await this.notificationsService.createNotification(
            targetId,
            'MATCH',
            `Bạn đã match với một người!`,
            match.id,
          );

          return {
            ...swipe,
            isMatch: true,
            message: 'Bạn đã match với user này!',
            match: match,
          };
        } catch (error) {
          // Nếu match đã tồn tại, vẫn return isMatch: true
          if (error instanceof ConflictException) {
            const existingMatch = await this.matchesService.findByUsers(
              swiperId,
              targetId,
            );
            return {
              ...swipe,
              isMatch: true,
              message: 'Bạn đã match với user này!',
              match: existingMatch,
            };
          }
          throw error;
        }
      }
    }

    return {
      ...swipe,
      isMatch: false,
    };
  }

  /**
   * Lấy tất cả swipes của một user
   * @param swiperId - ID của user
   * @returns Danh sách swipes
   */
  async findAll(swiperId: string) {
    return this.prisma.swipe.findMany({
      where: {
        swiperId,
      },
      include: {
        target: {
          include: {
            profile: {
              include: {
                tagLevel: true,
                tagSubject: true,
                tagGender: true,
                tagStudyStyle: true,
                tagLearningGoal: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Lấy danh sách users chưa được swipe để hiển thị (ML-powered)
   * @param swiperId - ID của user hiện tại
   * @param limit - Số lượng users muốn lấy (mặc định 10)
   * @param filters - Optional filters to override user's profile (subject, studyDays, studyTimes)
   * @returns Danh sách users chưa swipe, sorted by ML similarity
   */
  async findTargets(
    swiperId: string,
    limit: number = 10,
    filters?: {
      subject?: string;
      studyDays?: string[];
      studyTimes?: string[];
    }
  ) {
    // ============================================
    // STEP 1: Get excluded user IDs
    // ============================================
    const swipedUsers = await this.prisma.swipe.findMany({
      where: { swiperId },
      select: { targetId: true },
    });

    const swipedUserIds = swipedUsers.map((s) => s.targetId);
    const excludeIds = [swiperId, ...swipedUserIds];

    console.log(`🔍 [FindTargets] Swiper: ${swiperId}`);
    console.log(`📊 [FindTargets] Excluded: ${excludeIds.length} users`);
    if (filters) {
      console.log(`🎯 [FindTargets] Filters applied:`, filters);
    }

    // ============================================
    // STEP 2: Get swiper's profile for ML
    // ============================================
    const swiperProfile = await this.prisma.user.findUnique({
      where: { id: swiperId },
      include: {
        profile: {
          include: {
            tagSubject: true,
            tagLevel: true,
            tagGender: true,
            tagStudyStyle: true,
            tagLearningGoal: true,
          },
        },
        studySlots: {
          include: {
            tagStudyDay: true,
            tagStudyTime: true,
          },
        },
      },
    });

    if (!swiperProfile?.profile) {
      console.warn(`⚠️  [FindTargets] No profile for ${swiperId}, using fallback`);
      return this.getRandomTargets(excludeIds, limit);
    }

    // ============================================
    // STEP 3: Prepare ML request (with optional filters override)
    // ============================================
    const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:8000';

    try {
      // Get study days and times from studySlots or filters
      let studyDays: string[];
      let studyTimes: string[];

      if (filters?.studyDays || filters?.studyTimes) {
        // Use filter overrides
        studyDays = filters.studyDays || this.extractStudyDaysFromSlots(swiperProfile.studySlots);
        studyTimes = filters.studyTimes || this.extractStudyTimesFromSlots(swiperProfile.studySlots);
      } else {
        // Use profile data
        studyDays = this.extractStudyDaysFromSlots(swiperProfile.studySlots);
        studyTimes = this.extractStudyTimesFromSlots(swiperProfile.studySlots);
      }

      // Extract numeric grade from tagLevel.name (e.g., "Grade 10" -> "10")
      let gradeValue = '11'; // Default
      if (swiperProfile.profile.tagLevel?.name) {
        const match = swiperProfile.profile.tagLevel.name.match(/\d+/);
        gradeValue = match ? match[0] : '11';
      }

      // Map database tags to ML server format
      const mlRequest = {
        name: swiperProfile.profile.username || swiperProfile.email,
        email: swiperProfile.email,
        grade: gradeValue, // Send numeric string: "10", "11", or "12"
        tag_subject: filters?.subject
          ? this.mapSubjectToML(filters.subject)
          : this.mapSubjectToML(swiperProfile.profile.tagSubject?.name),
        tag_study_days: studyDays,
        tag_study_times: studyTimes,
      };

      console.log(`🤖 [ML] Calling ML server:`, mlRequest);

      const mlResponse = await axios.post(
        `${ML_SERVER_URL}/match`,
        mlRequest,
        {
          params: { top_n: limit * 3 }, // Request more to account for exclusions
          timeout: 5000, // 5s timeout
        },
      );

      const matchedPartners = mlResponse.data.matched_partners || [];
      console.log(`✅ [ML] Received ${matchedPartners.length} matches`);

      if (matchedPartners.length === 0) {
        console.warn('⚠️  [ML] No recommendations, using fallback');
        return this.getRandomTargets(excludeIds, limit);
      }

      // ============================================
      // STEP 4: Extract recommended user emails
      // ============================================
      const recommendedEmails = matchedPartners.map((p: any) => p.email);

      // ============================================
      // STEP 5: Query database for recommended users
      // ============================================
      const targets = await this.prisma.user.findMany({
        where: {
          AND: [
            {
              email: {
                in: recommendedEmails, // ML recommendations
              },
            },
            {
              id: {
                notIn: excludeIds, // Not swiped yet
              },
            },
            {
              isActive: true,
            },
            {
              profile: {
                isNot: null,
              },
            },
          ],
        },
        include: {
          profile: {
            include: {
              tagLevel: true,
              tagSubject: true,
              tagGender: true,
              tagStudyStyle: true,
              tagLearningGoal: true,
              tagStudyDay: true,
              tagStudyTime: true,
              photos: true,
            },
          },
          studySlots: {
            include: {
              tagStudyDay: true,
              tagStudyTime: true,
            },
          },
        },
        // Remove take limit - let ML server rank all, then limit after sorting
      });

      // ============================================
      // STEP 6: Sort by ML ranking
      // ============================================
      const sortedTargets = targets.sort((a, b) => {
        const indexA = recommendedEmails.indexOf(a.email);
        const indexB = recommendedEmails.indexOf(b.email);
        return indexA - indexB;
      });

      // Debug: Log final ranking
      console.log(`🎯 [Complete] ML server recommended ${sortedTargets.length} users`);
      console.log('📊 [Ranking] Top 5:');
      sortedTargets.slice(0, 5).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.profile?.username || t.email} (${t.email})`);
      });

      // Limit AFTER sorting to get top N by ML ranking
      return sortedTargets.slice(0, limit);
    } catch (error) {
      console.error('❌ [ML] Error calling ML server:', error.message);
      console.warn('⚠️  [ML] Fallback to random targets');

      // Fallback if ML server unavailable
      return this.getRandomTargets(excludeIds, limit);
    }
  }

  /**
   * Extract study days from studySlots array
   */
  private extractStudyDaysFromSlots(studySlots: any[]): string[] {
    if (!studySlots || studySlots.length === 0) {
      return ['Monday', 'Wednesday', 'Friday']; // Default
    }

    const uniqueDays = Array.from(
      new Set(studySlots.map(slot => slot.tagStudyDay?.name).filter(Boolean))
    );

    return uniqueDays.length > 0 ? uniqueDays : ['Monday', 'Wednesday', 'Friday'];
  }

  /**
   * Extract study times from studySlots array
   */
  private extractStudyTimesFromSlots(studySlots: any[]): string[] {
    if (!studySlots || studySlots.length === 0) {
      return ['Morning', 'Evening']; // Default
    }

    const uniqueTimes = Array.from(
      new Set(studySlots.map(slot => slot.tagStudyTime?.name).filter(Boolean))
    );

    return uniqueTimes.length > 0 ? uniqueTimes : ['Morning', 'Evening'];
  }

  /**
   * Fallback method: Get random targets when ML server unavailable
   * @param excludeIds - IDs to exclude (swiper + already swiped)
   * @param limit - Number of targets to return
   * @returns Random users from database
   */
  private async getRandomTargets(excludeIds: string[], limit: number) {
    console.log(`🎲 [Fallback] Getting ${limit} random targets`);

    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: excludeIds } },
          { isActive: true },
          { profile: { isNot: null } },
        ],
      },
      include: {
        profile: {
          include: {
            tagLevel: true,
            tagSubject: true,
            tagGender: true,
            tagStudyStyle: true,
            tagLearningGoal: true,
            tagStudyDay: true,
            tagStudyTime: true,
            photos: true,
          },
        },
        studySlots: {
          include: {
            tagStudyDay: true,
            tagStudyTime: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Map database subject names to ML server format
   */
  private mapSubjectToML(subject: string | undefined): string {
    const subjectMap: { [key: string]: string } = {
      'Toán học': 'math',
      'Vật lý': 'physics',
      'Hóa học': 'chemistry',
      'Sinh học': 'biology',
      'Tiếng Anh': 'english',
      'Tin học': 'computer',
      'Mathematics': 'math',
      'Physics': 'physics',
      'Chemistry': 'chemistry',
      'Biology': 'biology',
      'English': 'english',
      'Computer Science': 'computer',
    };

    return subjectMap[subject || ''] || 'math';
  }

  /**
   * Map database day names to ML server format
   */
  private mapDaysToML(day: string | undefined): string[] {
    const dayMap: { [key: string]: string } = {
      'Thứ 2': 'monday',
      'Thứ 3': 'tuesday',
      'Thứ 4': 'wednesday',
      'Thứ 5': 'thursday',
      'Thứ 6': 'friday',
      'Thứ 7': 'saturday',
      'Chủ nhật': 'sunday',
      'Monday': 'monday',
      'Tuesday': 'tuesday',
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday',
    };

    if (!day) return ['monday', 'wednesday', 'friday']; // Default

    const mapped = dayMap[day];
    return mapped ? [mapped] : ['monday'];
  }

  /**
   * Map database time names to ML server format
   */
  private mapTimesToML(time: string | undefined): string[] {
    const timeMap: { [key: string]: string } = {
      'Sáng': 'morning',
      'Chiều': 'afternoon',
      'Tối': 'evening',
      'Đêm': 'night',
      'Morning': 'morning',
      'Afternoon': 'afternoon',
      'Evening': 'evening',
      'Night': 'night',
      'Morning (6AM-12PM)': 'morning',
      'Afternoon (12PM-6PM)': 'afternoon',
      'Evening (6PM-9PM)': 'evening',
      'Night (9PM-12AM)': 'night',
    };

    if (!time) return ['morning', 'evening']; // Default

    const mapped = timeMap[time];
    return mapped ? [mapped] : ['morning'];
  }

  /**
   * Lấy chi tiết một swipe
   * @param swipeId - ID của swipe
   * @returns Chi tiết swipe
   */
  async findOne(swipeId: string) {
    const swipe = await this.prisma.swipe.findUnique({
      where: {
        id: swipeId,
      },
      include: {
        swiper: {
          include: {
            profile: {
              include: {
                tagLevel: true,
                tagSubject: true,
                tagGender: true,
                tagStudyStyle: true,
                tagLearningGoal: true,
              },
            },
          },
        },
        target: {
          include: {
            profile: {
              include: {
                tagLevel: true,
                tagSubject: true,
                tagGender: true,
                tagStudyStyle: true,
                tagLearningGoal: true,
              },
            },
          },
        },
      },
    });

    if (!swipe) {
      throw new NotFoundException('Swipe không tồn tại');
    }

    return swipe;
  }

  /**
   * Xóa một swipe (undo swipe)
   * @param swipeId - ID của swipe
   * @param swiperId - ID của user (để verify quyền)
   * @returns Swipe đã xóa
   */
  async remove(swipeId: string, swiperId: string) {
    const swipe = await this.prisma.swipe.findUnique({
      where: {
        id: swipeId,
      },
    });

    if (!swipe) {
      throw new NotFoundException('Swipe không tồn tại');
    }

    if (swipe.swiperId !== swiperId) {
      throw new BadRequestException('Không có quyền xóa swipe này');
    }

    return this.prisma.swipe.delete({
      where: {
        id: swipeId,
      },
    });
  }
}

