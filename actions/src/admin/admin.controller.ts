import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ReviewModerationDto } from './dto/review-moderation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getDashboardStats() {
    const stats = await this.adminService.getAdminStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('moderations')
  @ApiOperation({ summary: 'Get all moderation reports' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by source' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'Moderation reports retrieved successfully' })
  async getModerationReports(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const reports = await this.adminService.getModerationReports({
      status,
      type,
      source,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    return {
      success: true,
      data: reports,
    };
  }

  @Get('moderations/:id')
  @ApiOperation({ summary: 'Get moderation report by ID' })
  @ApiResponse({ status: 200, description: 'Moderation report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Moderation report not found' })
  async getModerationReport(@Param('id') id: string) {
    const report = await this.adminService.getModerationReportById(id);
    return {
      success: true,
      data: report,
    };
  }

  @Put('moderations/:id/review')
  @ApiOperation({ summary: 'Review and resolve a moderation report' })
  @ApiResponse({ status: 200, description: 'Moderation report reviewed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not an admin' })
  @ApiResponse({ status: 404, description: 'Moderation report not found' })
  async reviewModerationReport(
    @Request() req: any,
    @Param('id') id: string,
    @Body() reviewDto: ReviewModerationDto,
  ) {
    // Get userId from JWT token (userId for old tokens, id for new tokens)
    console.log('🔍 [AdminController] req.user:', req.user);
    const reviewerId = req.user?.userId || req.user?.id;
    console.log('🔍 [AdminController] reviewerId:', reviewerId);
    if (!reviewerId) {
      throw new Error('User ID not found in token');
    }
    const reviewed = await this.adminService.reviewModerationReport(
      id,
      reviewerId,
      reviewDto,
    );
    return {
      success: true,
      message: 'Moderation report reviewed successfully',
      data: reviewed,
    };
  }

  @Public()
  @Get('violation-keywords')
  @ApiOperation({ summary: 'Get violation keywords (public for chatserver)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by violation type' })
  @ApiResponse({ status: 200, description: 'Violation keywords retrieved successfully' })
  async getViolationKeywords(@Query('type') type?: string) {
    return await this.adminService.getViolationKeywords(type);
  }

  @Post('violation-keywords')
  @ApiOperation({ summary: 'Add a violation keyword' })
  @ApiResponse({ status: 201, description: 'Violation keyword added successfully' })
  async addViolationKeyword(
    @Body() body: { type: string; keyword: string },
  ) {
    return await this.adminService.addViolationKeyword(body.type, body.keyword);
  }

  @Post('violation-keywords/remove')
  @ApiOperation({ summary: 'Remove a violation keyword' })
  @ApiResponse({ status: 200, description: 'Violation keyword removed successfully' })
  async removeViolationKeyword(
    @Body() body: { type: string; keyword: string },
  ) {
    return await this.adminService.removeViolationKeyword(body.type, body.keyword);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      search,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    };
    const result = await this.adminService.getUsers(filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    const user = await this.adminService.getUserById(id);
    return {
      success: true,
      data: user,
    };
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  async banUser(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const adminId = req.user?.userId || req.user?.id;
    await this.adminService.banUser(id, body.reason, adminId);
    return {
      success: true,
      message: 'User banned successfully',
    };
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  async unbanUser(@Request() req: any, @Param('id') id: string) {
    const adminId = req.user?.userId || req.user?.id;
    await this.adminService.unbanUser(id, adminId);
    return {
      success: true,
      message: 'User unbanned successfully',
    };
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get all documents' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getDocuments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 20;
    return await this.adminService.getAllDocuments(pageNum, limitNum, status);
  }

  @Get('document-reports')
  @ApiOperation({ summary: 'Get document reports' })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Document reports retrieved successfully' })
  async getDocumentReports(@Query('status') status?: string) {
    return await this.adminService.getDocumentReports(status);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  async getDocument(@Param('id') id: string) {
    return await this.adminService.getDocumentById(id);
  }

  @Put('documents/:id')
  @ApiOperation({ summary: 'Delete (archive) a document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  async deleteDocument(@Param('id') id: string) {
    return await this.adminService.deleteDocument(id);
  }
}

