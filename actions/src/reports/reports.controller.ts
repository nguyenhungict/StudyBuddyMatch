import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';


@ApiTags('Reports')
@Controller('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - already reported' })
  @ApiResponse({ status: 404, description: 'Target not found' })
  async createReport(@Request() req: any, @Body() createReportDto: CreateReportDto) {
    const userId = req.user.id;
    const report = await this.reportsService.createReport(userId, createReportDto);
    return {
      success: true,
      message: 'Report submitted successfully',
      data: report,
    };
  }

  @Get('my-reports')
  @ApiOperation({ summary: 'Get current user reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getMyReports(@Request() req: any) {
    const userId = req.user.id;
    const reports = await this.reportsService.getUserReports(userId);
    return {
      success: true,
      data: reports,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReport(@Param('id') id: string) {
    const report = await this.reportsService.getReportById(id);
    return {
      success: true,
      data: report,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a report' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - report already reviewed or time limit exceeded' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the report owner' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    const userId = req.user.id;
    const report = await this.reportsService.updateReport(id, userId, updateReportDto);
    return {
      success: true,
      message: 'Report updated successfully',
      data: report,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - report already reviewed' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the report owner' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async deleteReport(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const result = await this.reportsService.deleteReport(id, userId);
    return result;
  }
}


