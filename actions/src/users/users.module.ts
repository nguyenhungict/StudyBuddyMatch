import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
// 👇 Đảm bảo đường dẫn này đúng với máy bạn (từ users ra prisma)
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [
    PrismaModule, // <--- THÊM DÒNG NÀY ĐỂ SỬA LỖI
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}