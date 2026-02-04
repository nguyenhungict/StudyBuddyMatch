import { Injectable, NotFoundException, ForbiddenException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ResourceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) { }

    async create(userId: string, dto: CreateResourceDto, file: Express.Multer.File) {
        try {
            // Upload file first
            const fileUrl = await this.uploadService.upload(file);

            // Truncate fields to match schema constraints
            const title = dto.title?.substring(0, 255) || 'Untitled';
            const description = dto.description?.substring(0, 1000); // Limit description
            const subject = dto.subject?.substring(0, 100);
            const fileName = file.originalname?.substring(0, 255);
            const fileType = file.mimetype?.substring(0, 50);
            const fileSize = file.size.toString().substring(0, 50);
            const truncatedFileUrl = fileUrl?.substring(0, 500);

            console.log('Creating resource with data:', {
                userId,
                title,
                description: description?.length,
                subject,
                fileName,
                fileUrl: truncatedFileUrl,
                fileType,
                fileSize,
            });

            // Create resource with file metadata
            return this.prisma.resource.create({
                data: {
                    userId,
                    title,
                    description,
                    subject,
                    grade: dto.grade?.substring(0, 50),
                    fileName,
                    fileUrl: truncatedFileUrl,
                    fileType,
                    fileSize,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    username: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error creating resource:', error);
            throw error;
        }
    }

    async findAll() {
        return this.prisma.resource.findMany({
            where: {
                status: 'PUBLISHED',
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        const resource = await this.prisma.resource.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                username: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!resource) {
            throw new NotFoundException('Resource not found');
        }

        return resource;
    }

    async download(id: string, res: Response): Promise<StreamableFile> {
        // 1. Get resource
        const resource = await this.prisma.resource.findUnique({
            where: { id },
            select: {
                fileUrl: true,
                fileName: true,
                fileType: true,
            },
        });

        if (!resource || !resource.fileUrl) {
            throw new NotFoundException('Resource or file not found');
        }

        // 2. Build file path
        const fileName = path.basename(resource.fileUrl);
        const filePath = path.join(process.cwd(), 'uploads', fileName);

        // 3. Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException('File not found on server');
        }

        // 4. Create file stream
        const file = fs.createReadStream(filePath);

        // 5. Set response headers
        res.set({
            'Content-Type': resource.fileType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${resource.fileName || fileName}"`,
        });

        return new StreamableFile(file);
    }

    async remove(userId: string, id: string) {
        // 1. Get resource to check ownership and file path
        const resource = await this.prisma.resource.findUnique({
            where: { id },
            select: { userId: true, fileUrl: true },
        });

        if (!resource) {
            throw new NotFoundException('Resource not found');
        }

        // 2. Check authorization - only author can delete
        if (resource.userId !== userId) {
            throw new ForbiddenException('You can only delete your own resources');
        }

        // 3. Delete physical file if exists
        if (resource.fileUrl) {
            try {
                const fileName = path.basename(resource.fileUrl);
                const filePath = path.join(process.cwd(), 'uploads', fileName);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted file: ${filePath}`);
                }
            } catch (error) {
                console.error('Error deleting file:', error);
            }
        }

        // 4. Delete database record
        await this.prisma.resource.delete({
            where: { id },
        });

        return { message: 'Resource deleted successfully' };
    }

    async getDemoUserId(): Promise<string> {

        const user = await this.prisma.user.findFirst({
            select: { id: true },
        });

        if (!user) {
            throw new Error('No users found in database. Please create a user first.');
        }

        return user.id;
    }
}
