import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto } from './dto/update-profile.dto'; // Đảm bảo import đúng DTO mới

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // API lấy thông tin profile hiện tại (GET /users/profile)
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    // req.user.userId (hoặc req.user.id) được tạo ra từ JwtStrategy
    // Hàm findOne bên service đã bao gồm logic map dữ liệu Tag -> Mảng cho frontend
    const userId = req.user.userId || req.user.id;
    return await this.usersService.findOne(userId);
  }

  // API Cập nhật Profile (PATCH /users/profile)
  // Step 1-6 ở Frontend sẽ gọi vào đây
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.userId || req.user.id;
    // Gọi hàm update (Adapter) bên service để xử lý lưu vào các bảng Tag/UserStudySlot
    return await this.usersService.update(userId, updateProfileDto);
  }

  // API Upload Profile Photos (POST /users/profile-photos)
  @UseGuards(AuthGuard('jwt'))
  @Post('profile-photos')
  async uploadProfilePhotos(@Request() req, @Body() body: { photos: string[] }) {
    const userId = req.user.userId || req.user.id;
    return await this.usersService.uploadProfilePhotos(userId, body.photos);
  }

  // API Get Profile Photos (GET /users/profile-photos)
  @UseGuards(AuthGuard('jwt'))
  @Get('profile-photos')
  async getProfilePhotos(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return await this.usersService.getProfilePhotos(userId);
  }

  // API Delete Profile Photo (DELETE /users/profile-photos/:id)
  @UseGuards(AuthGuard('jwt'))
  @Delete('profile-photos/:id')
  async deleteProfilePhoto(@Request() req, @Param('id') photoId: string) {
    const userId = req.user.userId || req.user.id;
    return await this.usersService.deleteProfilePhoto(userId, photoId);
  }

  // API Get Account Status (GET /users/account-status)
  @UseGuards(AuthGuard('jwt'))
  @Get('account-status')
  async getAccountStatus(@Request() req) {
    const userId = req.user.userId || req.user.id;
    return await this.usersService.getAccountStatus(userId);
  }

  // API lấy tất cả users cho ML Server (GET /users/for-matching)
  // Public endpoint - không cần auth vì ML server gọi
  @Get('for-matching')
  async getUsersForMatching() {
    console.log('📊 [API] ML Server requesting users for matching');
    return await this.usersService.findAllForMatching();
  }

  // API lấy profile công khai của user theo ID (GET /users/:id/public-profile)
  // Public endpoint - dùng cho xem profile từ chat
  @Get(':id/public-profile')
  async getPublicProfile(@Param('id') userId: string) {
    console.log('👤 [API] Fetching public profile for user:', userId);
    return await this.usersService.findPublicProfile(userId);
  }
}