import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private prisma: PrismaService,
  ) { }

  // ==============================
  // 1. REGISTER
  // ==============================
  async register(registerDto: RegisterDto) {
    // 1. Check email
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) throw new BadRequestException('Email already exists');

    // 2. Check Role
    const roleUser = await this.prisma.role.findFirst({ where: { name: "USER" } });
    if (!roleUser) throw new BadRequestException('System error: Role USER not found');

    // 3. Hash Pass
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 4. Create User
    const newUser = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        isActive: true,
        roleId: roleUser.id,
        profile: {
          create: {
            username: registerDto.fullName || registerDto.email.split('@')[0],
            usernameCode: `u${Date.now()}`,
            //birthday: new Date(2000, 0, 1),
            tagLevel: { connectOrCreate: { where: { code: 'Unknown' }, create: { code: 'Unknown', name: 'Unknown' } } },
            tagSubject: { connectOrCreate: { where: { code: 'General' }, create: { code: 'General', name: 'General' } } }
          }
        }
      },
      include: { profile: true }
    }) as any;
    console.log("user", newUser)
    // 5. Create Token & Send Mail
    const verificationToken = uuidv4();
    console.log("verificationToken", verificationToken)
    await this.usersService.createVerifyCode(newUser.id, verificationToken, 'REGISTER');

    const verifyLink = `http://localhost:3000/verify-email?token=${verificationToken}`;
    console.log("verifyLink", verifyLink)
    const fullName = registerDto.fullName || newUser.profile?.username || 'Student';
    console.log("fullName", fullName)
    // 👉 BLACK - GOLD EMAIL TEMPLATE (Standard Image 1)
    await this.mailerService.sendMail({
      to: newUser.email,
      subject: 'Verify your email for Study Buddy Match',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: #000000; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h2 style="color: #f1c40f; margin: 0; font-weight: bold;">Study Buddy Match</h2>
          </div>

          <div style="background-color: #ffffff; padding: 40px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; color: #333;">
            <h2 style="margin-top: 0; color: #000;">Hello ${fullName}! 👋</h2>

            <p style="color: #555; line-height: 1.6;">
              Thank you for joining <strong>Study Buddy Match</strong>. We are excited to have you on board! You are just one step away from finding your perfect study partner.
            </p>

            <p style="color: #555; line-height: 1.6;">
              To ensure the security of your account and access all features, please verify your email address by clicking the button below:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" style="background-color: #f1c40f; color: #000000; text-decoration: none; padding: 15px 30px; font-weight: bold; border-radius: 5px; display: inline-block; font-size: 16px;">
                Verify My Email
              </a>
            </div>

            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; font-size: 14px; color: #777;">
              <p>If the button above doesn't work, please click here:<br>
              <a href="${verifyLink}" style="color: #007bff; text-decoration: none;">Welcome to Study Buddy Match</a></p>

              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                If you didn't create an account with Study Buddy Match, you can safely ignore this email.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Study Buddy Match Inc. All rights reserved.<br>
            Sent with ❤️ for better learning.
          </div>
        </div>
      `,
    });

    return { message: 'Registration successful! Please check your email.' };
  }

  // ==============================
  // 2. VERIFY
  // ==============================
  async verifyEmail(token: string) {
    const record = await this.usersService.findValidVerifyCode(token, 'REGISTER');
    if (!record) throw new BadRequestException('Invalid or expired verification code');

    await this.usersService.markEmailAsVerified(record.userId, record.id);
    return { message: 'Email verification successful! You can now log in.' };
  }

  // ==============================
  // 3. LOGIN (UPDATED WITH 5-MINUTE LOCK LOGIC)
  // ==============================
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email) as any;
    if (!user) throw new UnauthorizedException('Account does not exist.');

    // 1. CHECK ACTIVE / BAN STATUS
    if (user.isActive === false) {
      // If no bannedUntil date -> Permanent ban
      if (!user.bannedUntil) {
        throw new UnauthorizedException('Your account has been permanently disabled.');
      }

      // If has bannedUntil date
      const now = new Date();
      if (user.bannedUntil > now) {
        const dateStr = new Date(user.bannedUntil).toLocaleString('en-US');
        throw new UnauthorizedException(`Account temporarily banned until ${dateStr}.`);
      } else {
        // Ban expired -> Auto reactivate
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: true,
            bannedUntil: null
          },
        });
        // Update current user object state to proceed
        user.isActive = true;
        user.bannedUntil = null;
      }
    }

    // 2. CHECK IF ACCOUNT LOCKED (DUE TO FAILED INCORRECT LOGINS)
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockUntil.getTime() - new Date().getTime()) / 1000 / 60);
      throw new UnauthorizedException(`Account is temporarily locked. Please try again in ${remainingTime} minutes.`);
    }

    // 3. CHECK EMAIL VERIFICATION
    if (!user.emailVerifiedAt) throw new UnauthorizedException('Account is not verified.');

    // 4. CHECK PASSWORD
    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    // --- IF PASSWORD INCORRECT ---
    if (!isMatch) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;

      // If failed 5 times -> Lock for 5 minutes
      if (newAttempts >= 5) {
        const lockTime = new Date();
        lockTime.setMinutes(lockTime.getMinutes() + 5); // Add 5 minutes

        await this.usersService.updateFailedLogin(user.id, newAttempts, lockTime);
        throw new UnauthorizedException('You entered incorrect password 5 times. Account locked for 5 minutes.');
      }
      // If less than 5 times -> Notify remaining attempts
      else {
        await this.usersService.updateFailedLogin(user.id, newAttempts, null);
        throw new UnauthorizedException(`Incorrect password. You have ${5 - newAttempts} attempts remaining.`);
      }
    }

    // --- IF PASSWORD CORRECT ---
    // Reset failed attempts to 0 and remove lock (if any)
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await this.usersService.resetLoginAttempts(user.id);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name || 'USER'
    };

    const displayName = user.profile?.username || user.email.split('@')[0];

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: displayName,
        avatar: user.profile?.avatarUrl,
        hasProfile: !!user.profile
      }
    };
  }

  // ==============================
  // 4. FORGOT PASSWORD
  // ==============================
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: 'If the email exists, a verification code has been sent.' };

    const resetToken = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10);

    await this.usersService.updateResetToken(email, resetToken, expiryDate);

    // 👉 BLACK - GOLD EMAIL TEMPLATE + DASHED BORDER (Standard Image 2)
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: #000000; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h2 style="color: #f1c40f; margin: 0; font-weight: bold;">Study Buddy Match</h2>
          </div>
          
          <div style="background-color: #ffffff; padding: 40px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; color: #333;">
            <h2 style="margin-top: 0; color: #000;">Password Reset Request</h2>
            
            <p style="color: #555; line-height: 1.6;">
              We received a request to reset the password for your account. If you made this request, please use the verification code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; border: 2px dashed #333; padding: 15px 50px; border-radius: 8px; background-color: #fafafa;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${resetToken}</span>
              </div>
            </div>

            <p style="text-align: center; color: #e74c3c; font-weight: bold; font-size: 14px;">
              This code will expire in 10 minutes.
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; font-size: 13px; color: #777;">
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Study Buddy Match Inc. All rights reserved.
          </div>
        </div>
      `,
    });

    return { message: 'A 4-digit verification code has been sent to your email.' };
  }

  // ==============================
  // 5. OTHER METHODS
  // ==============================
  async resetPassword(token: string, newP: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) throw new BadRequestException('Invalid or expired verification code');
    const newHash = await bcrypt.hash(newP, 10);
    await this.usersService.updatePassword(user.id, newHash);
    return { message: 'Password changed successfully.' };
  }

  async logout(userId: string) {
    return { message: 'Logged out successfully.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new UnauthorizedException('User does not exist');
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');
    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(userId, newHash);
    return { message: 'Password changed successfully!' };
  }
}