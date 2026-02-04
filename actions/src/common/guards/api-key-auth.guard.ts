import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  // Không cần constructor để inject ConfigService nữa

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    // Đọc trực tiếp từ process.env
    const validApiKey = process.env.INTERNAL_API_KEY;

    if (!validApiKey) {
      // Ném lỗi 500 nếu biến môi trường chưa được thiết lập trên server
      // Điều này giúp phát hiện lỗi cấu hình sớm
      console.error('FATAL ERROR: INTERNAL_API_KEY is not defined in environment variables.');
      throw new InternalServerErrorException('Server configuration error.');
    }

    if (apiKey === validApiKey) {
      return true; // Key hợp lệ, cho phép request
    }

    // Key không hợp lệ hoặc thiếu, từ chối request
    throw new UnauthorizedException('Invalid or missing API Key');
  }
}