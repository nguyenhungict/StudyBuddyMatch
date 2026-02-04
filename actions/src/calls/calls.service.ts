import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';

@Injectable()
export class CallsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tìm conversation giữa 2 users
     */
    private async findConversation(userId1: string, userId2: string) {
        // Tìm match giữa 2 users (không quan trọng thứ tự)
        const match = await this.prisma.match.findFirst({
            where: {
                OR: [
                    { user1Id: userId1, user2Id: userId2 },
                    { user1Id: userId2, user2Id: userId1 },
                ],
                status: 'ACTIVE',
            },
            include: {
                conversations: {
                    where: { status: 'OPEN' },
                    take: 1,
                },
            },
        });

        if (!match || !match.conversations || match.conversations.length === 0) {
            throw new NotFoundException(
                'No active conversation found between these users',
            );
        }

        return match.conversations[0];
    }

    /**
     * Khởi tạo cuộc gọi
     */
    async initiateCall(dto: InitiateCallDto) {
        const { callerId, recipientId, callType } = dto;

        // Kiểm tra caller và recipient tồn tại
        const caller = await this.prisma.user.findUnique({
            where: { id: callerId },
        });
        const recipient = await this.prisma.user.findUnique({
            where: { id: recipientId },
        });

        if (!caller || !recipient) {
            throw new NotFoundException('Caller or recipient not found');
        }

        // Tìm conversation
        const conversation = await this.findConversation(callerId, recipientId);

        // Tạo call record
        const call = await this.prisma.call.create({
            data: {
                callerId,
                recipientId,
                conversationId: conversation.id,
                callType: callType,
                status: 'CONNECTING',
                createdAt: new Date(),
            },
            include: {
                caller: {
                    include: { profile: true },
                },
                recipient: {
                    include: { profile: true },
                },
            },
        });

        // Tạo videoRoomId unique
        const videoRoomId = `video-${call.id}-${Date.now()}`;

        return {
            callId: call.id,
            videoRoomId,
            conversationId: conversation.id,
            caller: {
                id: call.caller.id,
                username: call.caller.profile?.username || call.caller.email,
            },
            recipient: {
                id: call.recipient.id,
                username: call.recipient.profile?.username || call.recipient.email,
            },
        };
    }

    /**
     * Cập nhật call (accept, end, duration, etc.)
     */
    async updateCall(callId: string, dto: UpdateCallDto) {
        // Kiểm tra call tồn tại
        const existingCall = await this.prisma.call.findUnique({
            where: { id: callId },
        });

        if (!existingCall) {
            throw new NotFoundException('Call not found');
        }

        // Update call
        const updatedCall = await this.prisma.call.update({
            where: { id: callId },
            data: {
                ...dto,
            },
        });

        return updatedCall;
    }

    /**
     * Lấy lịch sử cuộc gọi của user
     */
    async getCallHistory(userId: string, limit: number = 50) {
        const calls = await this.prisma.call.findMany({
            where: {
                OR: [{ callerId: userId }, { recipientId: userId }],
                status: 'ENDED', // Chỉ lấy cuộc gọi đã kết thúc
            },
            include: {
                caller: {
                    include: { profile: true },
                },
                recipient: {
                    include: { profile: true },
                },
                conversation: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return calls.map((call) => ({
            id: call.id,
            callType: call.callType,
            status: call.status,
            duration: call.duration,
            createdAt: call.createdAt,
            acceptedAt: call.acceptedAt,
            endedAt: call.endedAt,
            caller: {
                id: call.caller.id,
                username: call.caller.profile?.username || call.caller.email,
                avatarUrl: call.caller.profile?.avatarUrl,
            },
            recipient: {
                id: call.recipient.id,
                username: call.recipient.profile?.username || call.recipient.email,
                avatarUrl: call.recipient.profile?.avatarUrl,
            },
            isOutgoing: call.callerId === userId,
        }));
    }

    /**
     * Lấy chi tiết 1 cuộc gọi
     */
    async getCallById(callId: string) {
        const call = await this.prisma.call.findUnique({
            where: { id: callId },
            include: {
                caller: { include: { profile: true } },
                recipient: { include: { profile: true } },
                conversation: true,
            },
        });

        if (!call) {
            throw new NotFoundException('Call not found');
        }

        return call;
    }

    /**
     * Notify khi cuộc gọi kết thúc (từ video-server)
     */
    async notifyCallEnd(callId: string, duration: number, endedAt: Date) {
        return this.updateCall(callId, {
            status: 'ENDED',
            endedAt,
            duration,
        });
    }
}
