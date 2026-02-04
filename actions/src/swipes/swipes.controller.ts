import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SwipesService } from './swipes.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';

@ApiTags('swipes')
@Controller('swipes')
export class SwipesController {
  constructor(private readonly swipesService: SwipesService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo swipe mới (like/pass)' })
  @ApiResponse({
    status: 201,
    description: 'Swipe đã được tạo thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'User không tồn tại',
  })
  @ApiResponse({
    status: 409,
    description: 'Đã swipe user này rồi',
  })
  async create(@Request() req: any, @Body() createSwipeDto: CreateSwipeDto) {
    // TODO: Lấy userId từ JWT token hoặc session
    // Hiện tại tạm thời dùng query param hoặc body
    // Trong thực tế sẽ dùng: const swiperId = req.user.usersId;
    const swiperId = req.body.swiperId || req.query.swiperId;

    if (!swiperId) {
      throw new BadRequestException('swiperId is required. TODO: Get from JWT token');
    }

    return this.swipesService.create(swiperId, createSwipeDto);
  }

  @Get('targets')
  @ApiOperation({ summary: 'Lấy danh sách users để swipe (với optional filters)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách users chưa swipe',
  })
  async findTargets(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('subject') subject?: string,
    @Query('studyDays') studyDays?: string,
    @Query('studyTimes') studyTimes?: string,
  ) {
    // TODO: Lấy userId từ JWT token
    const swiperId = req.query.swiperId;

    if (!swiperId) {
      throw new BadRequestException('swiperId is required. TODO: Get from JWT token');
    }

    const limitNumber = limit ? parseInt(limit, 10) : 10;

    // Parse filter parameters
    const filters = {
      subject: subject || undefined,
      studyDays: studyDays ? studyDays.split(',') : undefined,
      studyTimes: studyTimes ? studyTimes.split(',') : undefined,
    };

    return this.swipesService.findTargets(swiperId, limitNumber, filters);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả swipes của user hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách swipes',
  })
  async findAll(@Request() req: any) {
    // TODO: Lấy userId từ JWT token
    const swiperId = req.query.swiperId;

    if (!swiperId) {
      throw new BadRequestException('swiperId is required. TODO: Get from JWT token');
    }

    return this.swipesService.findAll(swiperId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một swipe' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết swipe',
  })
  @ApiResponse({
    status: 404,
    description: 'Swipe không tồn tại',
  })
  async findOne(@Param('id') id: string) {
    return this.swipesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một swipe (undo swipe)' })
  @ApiResponse({
    status: 200,
    description: 'Swipe đã được xóa',
  })
  @ApiResponse({
    status: 404,
    description: 'Swipe không tồn tại',
  })
  async remove(@Request() req: any, @Param('id') id: string) {
    // TODO: Lấy userId từ JWT token
    const swiperId = req.query.swiperId;

    if (!swiperId) {
      throw new BadRequestException('swiperId is required. TODO: Get from JWT token');
    }

    return this.swipesService.remove(id, swiperId);
  }
}


