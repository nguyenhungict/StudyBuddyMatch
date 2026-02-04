import {
    Controller,
    Post,
    Patch,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CallsService } from './calls.service';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
    constructor(private readonly callsService: CallsService) { }

    /**
     * POST /api/calls/initiate
     * Khởi tạo cuộc gọi
     */
    @Post('initiate')
    async initiateCall(@Body() dto: InitiateCallDto) {
        return this.callsService.initiateCall(dto);
    }

    /**
     * PATCH /api/calls/:callId
     * Cập nhật cuộc gọi (accept, end, duration)
     */
    @Patch(':callId')
    async updateCall(@Param('callId') callId: string, @Body() dto: UpdateCallDto) {
        return this.callsService.updateCall(callId, dto);
    }

    /**
     * GET /api/calls/history?userId=xxx&limit=50
     * Lấy lịch sử cuộc gọi
     */
    @Get('history')
    async getCallHistory(
        @Query('userId') userId: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.callsService.getCallHistory(userId, limitNum);
    }

    /**
     * GET /api/calls/:callId
     * Lấy chi tiết cuộc gọi
     */
    @Get(':callId')
    async getCallById(@Param('callId') callId: string) {
        return this.callsService.getCallById(callId);
    }

    /**
     * POST /api/calls/notify-end
     * Video-server notify khi cuộc gọi kết thúc
     */
    @Post('notify-end')
    async notifyCallEnd(
        @Body()
        body: {
            callId: string;
            duration: number;
            endedAt: string;
        },
    ) {
        return this.callsService.notifyCallEnd(
            body.callId,
            body.duration,
            new Date(body.endedAt),
        );
    }
}
