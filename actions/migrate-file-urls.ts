import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function migrateFileUrls() {
    console.log('Starting file URL migration...');

    // Get all resources
    const resources = await prisma.resource.findMany({
        select: {
            id: true,
            title: true,
            fileName: true,
            fileUrl: true,
        },
    });

    console.log(`Found ${resources.length} resources to migrate`);

    // Get all files in uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const files = fs.readdirSync(uploadsDir).filter(f => {
        const fullPath = path.join(uploadsDir, f);
        return fs.statSync(fullPath).isFile() && f !== '.gitkeep';
    });

    console.log(`Found ${files.length} files in uploads directory`);

    // Try to match resources with files
    let updated = 0;
    for (const resource of resources) {
        // Skip if already has correct path format
        if (resource.fileUrl?.startsWith('/uploads/')) {
            console.log(`Resource "${resource.title}" already has correct path`);
            continue;
        }

        // Try to find matching file by fileName
        const matchingFile = files.find(f => {
            // Check if filename matches
            if (resource.fileName && f.includes(resource.fileName.replace(/\s+/g, ''))) {
                return true;
            }
            // Check if filename is in the file
            if (resource.fileName && f.toLowerCase().includes(resource.fileName.toLowerCase().substring(0, 10))) {
                return true;
            }
            return false;
        });

        if (matchingFile) {
            const newFileUrl = `/uploads/${matchingFile}`;
            await prisma.resource.update({
                where: { id: resource.id },
                data: { fileUrl: newFileUrl },
            });
            console.log(`✓ Updated "${resource.title}" -> ${newFileUrl}`);
            updated++;
        } else {
            console.log(`✗ No matching file found for "${resource.title}" (fileName: ${resource.fileName})`);
        }
    }

    console.log(`\nMigration complete! Updated ${updated} out of ${resources.length} resources.`);
    await prisma.$disconnect();
}

migrateFileUrls().catch(console.error);
