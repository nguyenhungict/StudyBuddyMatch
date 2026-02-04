import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ConversationsService))
    private readonly conversationsService: ConversationsService,
  ) { }

  /**
   * Tạo match khi có mutual swipe (cả 2 đều like nhau)
   * @param user1Id - ID của user 1
   * @param user2Id - ID của user 2
   * @param swipe1Id - ID của swipe từ user1 -> user2
   * @param swipe2Id - ID của swipe từ user2 -> user1
   * @returns Match đã tạo
   */
  async createMatch(
    user1Id: string,
    user2Id: string,
    swipe1Id: string,
    swipe2Id: string,
  ) {
    // Đảm bảo user1Id < user2Id để tránh duplicate
    const [user1, user2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    const [swipe1, swipe2] = user1Id < user2Id ? [swipe1Id, swipe2Id] : [swipe2Id, swipe1Id];

    // Kiểm tra đã có match chưa
    const existingMatch = await this.prisma.match.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: user1,
          user2Id: user2,
        },
      },
    });

    if (existingMatch) {
      throw new ConflictException('Match đã tồn tại');
    }

    // Tạo Match record
    const match = await this.prisma.match.create({
      data: {
        user1Id: user1,
        user2Id: user2,
        swipe1Id: swipe1,
        swipe2Id: swipe2,
        status: "ACTIVE"
      },
      include: {
        user1: {
          include: {
            profile: {
              include: {
                photos: true
              }
            },
          },
        },
        user2: {
          include: {
            profile: {
              include: {
                photos: true
              }
            },
          },
        },
        swipe1: true,
        swipe2: true,
      },
    });

    // Tạo notification cho cả hai user khi match thành công
    await this.createMatchNotifications({
      matchId: match.id,
      user1Id: user1,
      user2Id: user2,
    });

    // ✅ Tạo conversation trong MongoDB để users có thể chat ngay
    try {
      await this.conversationsService.createConversation(user1, user2);
      console.log(`📨 [Match] Conversation created for ${user1} and ${user2}`);
    } catch (error) {
      console.error('❌ [Match] Failed to create conversation:', error);
      // Don't fail the match if conversation creation fails
    }

    return match;
  }



  /**
   * Tạo notification cho 2 user khi match
   */
  private async createMatchNotifications(params: {
    matchId: string;
    user1Id: string;
    user2Id: string;
  }) {
    const { matchId, user1Id, user2Id } = params;
    console.log(matchId, user1Id, user2Id)
    // Không để việc tạo notification chặn luồng match chính
    try {
      // await this.prisma.notification.createMany({
      //   data: [
      //     {
      //       userId: user1Id,
      //       notice: 'Bạn đã match!',
      //       type: 'MATCH',
      //       matchId,
      //       requestId,
      //     },
      //     {
      //       userId: user2Id,
      //       notice: 'Bạn đã match!',
      //       type: 'MATCH',
      //       matchId,
      //       requestId,
      //     },
      //   ],
      // });
    } catch (error) {
      // Nuốt lỗi để không làm fail transaction chính; có thể log nếu cần
      // console.error('Failed to create match notifications', error);
    }
  }

  /**
   * Lấy tất cả matches của một user
   * @param userId - ID của user
   * @returns Danh sách matches
   */
  async findAll(userId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
        status: "ACTIVE",
      },
      include: {
        user1: {
          include: {
            profile: {
              include: {
                photos: true
              }
            },
          },
        },
        user2: {
          include: {
            profile: {
              include: {
                photos: true
              }
            },
          },
        },
        swipe1: true,
        swipe2: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Lấy chi tiết một match
   * @param matchId - ID của match
   * @returns Chi tiết match
   */
  async findOne(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        user1: {
          include: {
            profile: {
              include: {
                photos: true
              }
            },
          },
        },
        user2: {
          include: {
            profile: {
              include: {
                photos: true
              }
            },
          },
        },
        swipe1: true,
        swipe2: true,
        conversations: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match không tồn tại');
    }

    return match;
  }

  /**
   * Tìm match giữa 2 users
   * @param user1Id - ID của user 1
   * @param user2Id - ID của user 2
   * @returns Match nếu có, null nếu không
   */
  async findByUsers(user1Id: string, user2Id: string) {
    const [user1, user2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    return this.prisma.match.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: user1,
          user2Id: user2,
        },
      },
      include: {
        user1: {
          include: {
            profile: {
              include: {
                photos: true
              }
            },
          },
        },
        user2: {
          include: {
            profile: {
              include: {
                photos: true
              }
            },
          },
        },
        swipe1: true,
        swipe2: true,
      },
    });
  }

  /**
   * End match (khi user unmatch)
   * @param matchId - ID của match
   * @param userId - ID của user (để verify quyền)
   * @returns Match đã được end
   */
  async endMatch(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });

    if (!match) {
      throw new NotFoundException('Match không tồn tại');
    }

    // Kiểm tra user có trong match không
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new BadRequestException('Không có quyền end match này');
    }

    return this.prisma.match.update({
      where: {
        id: matchId,
      },
      data: {
        status: "UNMATCHED",
        endAt: new Date(),
      },
    });
  }
}

