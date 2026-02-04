import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { ViolationDetectionService } from './violation-detection.service';
import { ScanContentDto } from './dto/scan-content.dto';

@ApiTags('Moderation')
@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
    private readonly violationDetectionService: ViolationDetectionService,
  ) { }

  @Post('scan')
  @ApiOperation({ summary: 'Scan content for violations' })
  @ApiResponse({ status: 200, description: 'Content scanned successfully' })
  async scanContent(@Body() scanContentDto: ScanContentDto) {
    const result = this.violationDetectionService.scanContent(
      scanContentDto.content,
      scanContentDto.contentType || 'message',
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('keywords')
  @ApiOperation({ summary: 'Get violation keywords' })
  @ApiResponse({ status: 200, description: 'Keywords retrieved successfully' })
  async getKeywords(@Query('type') type?: string) {
    const keywords = this.violationDetectionService.getViolationKeywords(
      type as any,
    );
    return {
      success: true,
      data: keywords,
    };
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get moderation reports' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getReports(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const reports = await this.moderationService.getModerations({
      status,
      type,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
    return {
      success: true,
      data: reports,
    };
  }
}

