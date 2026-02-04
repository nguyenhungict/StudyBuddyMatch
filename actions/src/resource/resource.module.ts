import { Module } from '@nestjs/common';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [ResourceController],
    providers: [ResourceService],
    exports: [ResourceService],
})
export class ResourceModule { }
