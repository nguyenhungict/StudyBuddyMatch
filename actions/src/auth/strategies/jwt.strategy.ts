import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Quan trọng: Dòng này bảo Server tìm Token ở Header "Authorization: Bearer ..."
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKeyCuaBan', // Fallback nếu .env lỗi
    });
  }

  async validate(payload: any) {
    // Check if user exists and is active/not banned
    const id = payload.sub || payload.userId || payload.id;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        isActive: true, // Check active status
        bannedUntil: true, // Check ban duration
        role: { select: { name: true } }
      }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is inactive (permanently banned)
    if (user.isActive === false) {
      throw new UnauthorizedException({
        message: 'Your account has been permanently banned',
        code: 'ERR_USER_BANNED_PERMANENT',
      });
    }

    // Check if user is temporarily banned
    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      const banEnd = new Date(user.bannedUntil).toLocaleString();
      throw new UnauthorizedException({
        message: `Your account is temporarily banned until ${banEnd}`,
        code: 'ERR_USER_BANNED_TEMPORARY',
        bannedUntil: user.bannedUntil,
      });
    }

    // Payload là thông tin đã giải mã từ Token
    // Trả về cả id và userId để hỗ trợ cả old và new code
    return {
      id: user.id,        // For new code
      userId: user.id,    // For old code (backward compatibility)
      email: user.email,
      role: user.role?.name || payload.role,     // Include role for authorization checks
    };
  }
}