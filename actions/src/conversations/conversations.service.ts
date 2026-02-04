import { Injectable } from "@nestjs/common";
import ConversationModel from "../models/Conversation";
import UserModel from "../models/User";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) { }

  async getByUser(userId: string) {
    const conversations = await ConversationModel.find({
      members: { $in: [userId] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return await Promise.all(
      conversations.map(async (c: any) => {
        // Get the other user
        const otherUserId = c.members.find(
          (m: string) => m !== userId
        );

        // Query user from PostgreSQL (Prisma) instead of Mongo
        const otherUser = otherUserId
          ? await this.prisma.user.findUnique({
            where: { id: otherUserId },
            select: {
              id: true,
              profile: {
                select: {
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          })
          : null;

        // Resolve avatar URL - first try PostgreSQL, then fallback to MongoDB
        let avatar = otherUser?.profile?.avatarUrl || null;

        // If PostgreSQL doesn't have avatar, try MongoDB
        if (!avatar && otherUserId) {
          const mongoUser = await UserModel.findOne({ userId: otherUserId }).lean();
          avatar = (mongoUser as any)?.avatar || null;
        }

        // Resolve relative URLs
        if (avatar && avatar.startsWith('/uploads')) {
          avatar = `http://localhost:8888${avatar}`;
        }

        return {
          roomId: c.roomId,
          members: c.members,
          lastMessage: c.lastMessage || "",
          updatedAt: c.updatedAt,
          unreadCount: c.unread?.[userId] || 0,
          clearedAt: c.clearedAt?.[userId] || null,  // Add clearedAt for this user
          otherUserId,
          otherUserName: otherUser?.profile?.username || otherUserId,
          otherUserAvatar: avatar,
        };
      })
    );
  }

  /**
   * Create a new conversation when users match
   * @param user1Id - First user ID
   * @param user2Id - Second user ID
   * @returns Created conversation
   */
  async createConversation(user1Id: string, user2Id: string) {
    // Generate unique roomId from sorted user IDs (ensures consistency)
    const sortedIds = [user1Id, user2Id].sort();
    const roomId = `${sortedIds[0]}_${sortedIds[1]}`;

    // Check if conversation already exists
    const existing = await ConversationModel.findOne({ roomId });
    if (existing) {
      console.log(`✅ [Conversation] Already exists: ${roomId}`);
      return existing;
    }

    // Create new conversation
    const conversation = await ConversationModel.create({
      roomId,
      members: [user1Id, user2Id],
      lastMessage: '',
      updatedAt: new Date(),
      unread: {
        [user1Id]: 0,
        [user2Id]: 0,
      },
    });

    console.log(`✅ [Conversation] Created: ${roomId}`);
    return conversation;
  }

  /**
   * Clear chat for a specific user
   * Sets the clearedAt timestamp so messages before this time are hidden
   */
  async clearChat(roomId: string, userId: string) {
    const result = await ConversationModel.findOneAndUpdate(
      { roomId },
      { $set: { [`clearedAt.${userId}`]: new Date() } },
      { new: true, timestamps: false }
    );

    if (!result) {
      return { error: "Conversation not found" };
    }

    return {
      success: true,
      clearedAt: result.clearedAt?.get(userId)
    };
  }
}
