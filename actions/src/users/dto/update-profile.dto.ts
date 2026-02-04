import { IsString, IsOptional, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from '@prisma/client';

class StudyScheduleDto {
  @IsOptional() @IsArray() @IsString({ each: true }) days?: string[];
  @IsOptional() @IsString() time?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() gradeLevel?: string;
  @IsOptional() @IsString() birthday?: string;
  @IsOptional() gender?: any; 
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() achievement?: string;
  @IsOptional() @IsString() recentAchievement?: string;

  // 🔥 SỬA QUAN TRỌNG TẠI ĐÂY 🔥
  // Thêm @Transform để ép kiểu về mảng, tránh bị lỗi khi gửi 1 môn
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Nếu là chuỗi (VD: "Chemistry" hoặc "Math, Physics"), tách thành mảng
      return value.includes(',') ? value.split(',').map(s => s.trim()) : [value];
    }
    return value; // Nếu đã là mảng thì giữ nguyên
  })
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  // Study Style (Đã đúng, giữ nguyên)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.includes(',') ? value.split(',').map(s => s.trim()) : [value];
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  studyStyle?: string[];

  @IsOptional() @IsArray() @IsString({ each: true }) learningGoals?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => StudyScheduleDto)
  studySchedule?: StudyScheduleDto;
}