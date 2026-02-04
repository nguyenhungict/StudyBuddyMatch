import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo notification mới khi có swipe
     * @param userId - ID của user nhận notification
     * @param type - Loại notification: LIKE, MATCH, MESSAGE
     * @param content - Nội dung notification
     * @param matchId - ID của match (optional)
     */
    async createNotification(
        userId: string,
        type: string,
        content: string,
        matchId?: string,
    ) {
        return this.prisma.notification.create({
            data: {
                userId,
                type,
                content,
                matchId,
            },
        });
    }

    /**
     * Lấy tất cả notifications của user với thông tin người gửi từ Swipe
     * @param userId - ID của user
     * @returns Danh sách notifications với thông tin fromUser
     */
    async findAll(userId: string) {
        // Lấy notifications
        const notifications = await this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                match: true,
            },
        });

        // Với mỗi notification type LIKE, tìm swipe tương ứng để lấy thông tin người gửi
        const notificationsWithFromUser = await Promise.all(
            notifications.map(async (notification) => {
                if (notification.type === 'LIKE') {
                    // Tìm swipe có targetId = userId và chưa match (isLike = true)
                    // và createdAt gần với notification createdAt
                    const swipe = await this.prisma.swipe.findFirst({
                        where: {
                            targetId: userId,
                            isLike: true,
                            createdAt: {
                                // Tìm swipe được tạo trong vòng 5 giây trước notification
                                lte: notification.createdAt,
                                gte: new Date(
                                    notification.createdAt.getTime() - 5000,
                                ),
                            },
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
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    });

                    if (swipe) {
                        return {
                            ...notification,
                            fromUser: {
                                id: swipe.swiper.id,
                                email: swipe.swiper.email,
                                profile: swipe.swiper.profile,
                            },
                        };
                    }
                } else if (notification.type === 'MATCH' && notification.matchId) {
                    // Với MATCH, lấy thông tin user khác trong match
                    const match = await this.prisma.match.findUnique({
                        where: { id: notification.matchId },
                        include: {
                            user1: {
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
                            user2: {
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

                    if (match) {
                        // Lấy user khác (không phải userId)
                        const otherUser =
                            match.user1Id === userId ? match.user2 : match.user1;
                        return {
                            ...notification,
                            fromUser: {
                                id: otherUser.id,
                                email: otherUser.email,
                                profile: otherUser.profile,
                            },
                        };
                    }
                }

                return notification;
            }),
        );

        return notificationsWithFromUser;
    }

    /**
     * Đếm số notifications chưa đọc
     * @param userId - ID của user
     * @returns Số lượng notifications chưa đọc
     */
    async countUnread(userId: string) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return { count };
    }

    /**
     * Đánh dấu một notification là đã đọc
     * @param notificationId - ID của notification
     * @param userId - ID của user (để verify quyền)
     */
    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new NotFoundException('Notification không tồn tại');
        }

        if (notification.userId !== userId) {
            throw new NotFoundException('Không có quyền cập nhật notification này');
        }

        return this.prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    /**
     * Đánh dấu tất cả notifications là đã đọc
     * @param userId - ID của user
     */
    async markAllAsRead(userId: string) {
        await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return { success: true, message: 'Đã đánh dấu tất cả là đã đọc' };
    }

    /**
     * Xóa notification
     * @param notificationId - ID của notification
     * @param userId - ID của user (để verify quyền)
     */
    async remove(notificationId: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new NotFoundException('Notification không tồn tại');
        }

        if (notification.userId !== userId) {
            throw new NotFoundException('Không có quyền xóa notification này');
        }

        return this.prisma.notification.delete({
            where: { id: notificationId },
        });
    }
}
