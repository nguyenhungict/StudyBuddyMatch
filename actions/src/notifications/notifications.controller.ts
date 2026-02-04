import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Request,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /**
     * GET /notifications
     * Lấy tất cả notifications của user
     */
    @Get()
    @ApiOperation({ summary: 'Lấy tất cả notifications của user' })
    @ApiResponse({ status: 200, description: 'Danh sách notifications' })
    async findAll(@Request() req: any) {
        // TODO: Lấy userId từ JWT token
        const userId = req.query.userId;

        if (!userId) {
            throw new BadRequestException('userId is required. TODO: Get from JWT token');
        }

        return this.notificationsService.findAll(userId);
    }

    /**
     * POST /notifications
     * Tạo notification mới (dùng cho chatserver gửi reminder notifications)
     */
    @Post()
    @ApiOperation({ summary: 'Tạo notification mới' })
    @ApiResponse({ status: 201, description: 'Notification đã được tạo' })
    async create(@Body() body: { userId: string; type: string; content: string; matchId?: string }) {
        const { userId, type, content, matchId } = body;

        if (!userId || !type || !content) {
            throw new BadRequestException('userId, type, and content are required');
        }

        return this.notificationsService.createNotification(userId, type, content, matchId);
    }

    /**
     * GET /notifications/count
     * Đếm số notifications chưa đọc
     */
    @Get('count')
    @ApiOperation({ summary: 'Đếm số notifications chưa đọc' })
    @ApiResponse({ status: 200, description: 'Số lượng notifications chưa đọc' })
    async countUnread(@Request() req: any) {
        // TODO: Lấy userId từ JWT token
        const userId = req.query.userId;

        if (!userId) {
            throw new BadRequestException('userId is required. TODO: Get from JWT token');
        }

        return this.notificationsService.countUnread(userId);
    }

    /**
     * POST /notifications/:id/mark-read
     * Đánh dấu một notification là đã đọc
     */
    @Post(':id/mark-read')
    @ApiOperation({ summary: 'Đánh dấu một notification là đã đọc' })
    @ApiResponse({ status: 200, description: 'Notification đã được đánh dấu đã đọc' })
    async markAsRead(@Param('id') id: string, @Request() req: any) {
        // TODO: Lấy userId từ JWT token
        const userId = req.query.userId || req.body.userId;

        if (!userId) {
            throw new BadRequestException('userId is required. TODO: Get from JWT token');
        }

        return this.notificationsService.markAsRead(id, userId);
    }

    /**
     * POST /notifications/mark-all-read
     * Đánh dấu tất cả notifications là đã đọc
     */
    @Post('mark-all-read')
    @ApiOperation({ summary: 'Đánh dấu tất cả notifications là đã đọc' })
    @ApiResponse({ status: 200, description: 'Tất cả notifications đã được đánh dấu đã đọc' })
    async markAllAsRead(@Request() req: any) {
        // TODO: Lấy userId từ JWT token
        const userId = req.query.userId || req.body.userId;

        if (!userId) {
            throw new BadRequestException('userId is required. TODO: Get from JWT token');
        }

        return this.notificationsService.markAllAsRead(userId);
    }

    /**
     * DELETE /notifications/:id
     * Xóa một notification
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Xóa một notification' })
    @ApiResponse({ status: 200, description: 'Notification đã được xóa' })
    async remove(@Param('id') id: string, @Request() req: any) {
        // TODO: Lấy userId từ JWT token
        const userId = req.query.userId;

        if (!userId) {
            throw new BadRequestException('userId is required. TODO: Get from JWT token');
        }

        return this.notificationsService.remove(id, userId);
    }
}
