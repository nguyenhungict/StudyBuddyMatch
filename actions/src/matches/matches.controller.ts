import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) { }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả matches của user hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách matches',
  })
  async findAll(@Request() req: any) {
    // TODO: Lấy userId từ JWT token
    const userId = req.query.userId;

    if (!userId) {
      throw new BadRequestException('userId is required. TODO: Get from JWT token');
    }

    return this.matchesService.findAll(userId);
  }

  @Get('with/:userId')
  @ApiOperation({ summary: 'Tìm match với một user cụ thể' })
  @ApiResponse({
    status: 200,
    description: 'Match nếu có',
  })
  async findByUsers(
    @Request() req: any,
    @Param('userId') otherUserId: string,
  ) {
    // TODO: Lấy userId từ JWT token
    const userId = req.query.userId;

    if (!userId) {
      throw new BadRequestException('userId is required. TODO: Get from JWT token');
    }

    return this.matchesService.findByUsers(userId, otherUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một match' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết match',
  })
  @ApiResponse({
    status: 404,
    description: 'Match không tồn tại',
  })
  async findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'End match (unmatch)' })
  @ApiResponse({
    status: 200,
    description: 'Match đã được end',
  })
  @ApiResponse({
    status: 404,
    description: 'Match không tồn tại',
  })
  async endMatch(@Request() req: any, @Param('id') id: string) {
    // TODO: Lấy userId từ JWT token
    const userId = req.query.userId;

    if (!userId) {
      throw new BadRequestException('userId is required. TODO: Get from JWT token');
    }

    return this.matchesService.endMatch(id, userId);
  }
}


