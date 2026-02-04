import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException, StreamableFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Controller('resource')
export class ResourceController {
    constructor(
        private readonly resourceService: ResourceService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async create(
        @Request() req,
        @Body() dto: CreateResourceDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        const userId = req.user.userId;

        // Validate file
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new BadRequestException('File size cannot exceed 10MB');
        }

        return this.resourceService.create(userId, dto, file);
    }

    @Get()
    findAll() {
        return this.resourceService.findAll();
    }

    @Get(':id/download')
    async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
        return this.resourceService.download(id, res);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.resourceService.findOne(id);
    }


    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Request() req, @Param('id') id: string) {
        const userId = req.user.userId;
        return this.resourceService.remove(userId, id);
    }
}
