import { Injectable } from '@nestjs/common';

import { User, Prisma, RoleName, Gender } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import UserModel from '../models/User';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // Upload to Disk
  private saveAvatarToFile(base64String: string): string {
    try {
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return base64String;

      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const extension = matches[1].split('/')[1];
      const fileName = `${uuidv4()}.${extension}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
      return `/uploads/${fileName}`;
    } catch (error) {
      console.error("Lỗi lưu ảnh:", error);
      return "";
    }
  }

  // TÌM KIẾM (READ) -> SEARCH (READ)
  async findOne(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        profile: {
          include: {
            tagSubject: true,
            tagLevel: true,
            tagGender: true,
            tagStudyStyle: true,
            tagLearningGoal: true
          }
        },
        studySlots: { include: { tagStudyDay: true, tagStudyTime: true } }
      },
    });

    if (!user) return null;

    const profile: any = user.profile || {};

    if (user.profile) {
      user['fullName'] = user.profile.username || user.email.split('@')[0];

      if (profile.avatarUrl && profile.avatarUrl.startsWith('/uploads')) {
        profile.avatarUrl = `http://localhost:8888${profile.avatarUrl}`;
      }

      profile.birthday = user.profile.birthday ? user.profile.birthday.toISOString().split('T')[0] : "";

      if (user.profile.birthday) {
        const birthYear = new Date(user.profile.birthday).getFullYear();
        profile.age = new Date().getFullYear() - birthYear;
      } else {
        profile.age = 18;
      }

      profile.subjects = user.profile.tagSubject ? [user.profile.tagSubject.name] : [];
      profile.gradeLevel = user.profile.tagLevel ? user.profile.tagLevel.name : "";
      profile.gender = user.profile.gender || "PREFER_NOT_TO_SAY";
      profile.studyStyles = user.profile.tagStudyStyle ? [user.profile.tagStudyStyle.name] : [];
      profile.learningGoals = user.profile.tagLearningGoal ? [user.profile.tagLearningGoal.name] : [];

      const days = new Set<string>();
      const times = new Set<string>();
      user.studySlots.forEach(slot => {
        if (slot.tagStudyDay) days.add(slot.tagStudyDay.name);
        if (slot.tagStudyTime) times.add(slot.tagStudyTime.name);
      });
      profile.studySchedule = { days: Array.from(days), time: Array.from(times).join(", ") };
    }

    return { ...user, profile, hasProfile: !!(user.profile && user.profile.school) };
  }

  // Lấy profile công khai (cho xem từ chat)
  async findPublicProfile(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            tagSubject: true,
            tagLevel: true,
            tagGender: true,
            tagStudyStyle: true,
            tagLearningGoal: true,
            photos: {
              orderBy: { order: 'asc' }
            }
          }
        },
        studySlots: { include: { tagStudyDay: true, tagStudyTime: true } }
      },
    });

    if (!user || !user.profile) return null;

    const profile = user.profile;

    // Build avatar URL
    let avatarUrl = profile.avatarUrl || '';
    if (avatarUrl.startsWith('/uploads')) {
      avatarUrl = `http://localhost:8888${avatarUrl}`;
    }

    // Build schedule from studySlots
    const days = new Set<string>();
    const times = new Set<string>();
    user.studySlots.forEach(slot => {
      if (slot.tagStudyDay) {
        const dayMap: Record<string, string> = {
          'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed',
          'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
        };
        days.add(dayMap[slot.tagStudyDay.name] || slot.tagStudyDay.name.substring(0, 3));
      }
      if (slot.tagStudyTime) {
        const timeName = slot.tagStudyTime.name.split('(')[0].trim();
        times.add(timeName);
      }
    });

    // Build profile photos with full URLs
    const photos = profile.photos?.map(p =>
      p.photoUrl.startsWith('/uploads')
        ? `http://localhost:8888${p.photoUrl}`
        : p.photoUrl
    ) || [];

    return {
      id: user.id,
      name: profile.username || user.email.split('@')[0],
      avatar: avatarUrl,
      school: profile.school || '',
      grade: profile.tagLevel?.name || '',
      gender: profile.tagGender?.name || '',
      bio: profile.bio || '',
      subjects: profile.tagSubject ? [profile.tagSubject.name] : [],
      studyStyle: profile.tagStudyStyle?.name || '',
      goals: profile.tagLearningGoal ? [profile.tagLearningGoal.name] : [],
      schedule: [...Array.from(days), ...Array.from(times)],
      photos: photos,
    };
  }

  async findByEmail(email: string): Promise<User | null> { return this.prisma.user.findUnique({ where: { email }, include: { role: true, profile: true } }); }
  async findRoleByName(name: RoleName) { return this.prisma.role.findFirst({ where: { name } }); }

  // =========================================================
  // 2. UPDATE PROFILE (WRITE) - FIXED SUBJECT SELECTION LOGIC
  // =========================================================
  async update(id: string, updateProfileDto: UpdateProfileDto) {
    const { fullName, ...rawData } = updateProfileDto as any;

    // 🔥 LOG DATA: For debug if needed
    console.log("🔥 [DEBUG] Update Data:", JSON.stringify(rawData, null, 2));

    // 1. Handle Image
    let finalAvatarUrl = rawData.avatarUrl || rawData.avatar;
    if (finalAvatarUrl && finalAvatarUrl.includes('base64')) {
      finalAvatarUrl = this.saveAvatarToFile(finalAvatarUrl);
    }

    // 2. Prepare basic data
    const profileUpdateData: any = {
      bio: rawData.bio,
      school: rawData.school,
      achievement: rawData.achievement || rawData.recentAchievement,
      avatarUrl: finalAvatarUrl,
      username: fullName,
      birthday: rawData.birthday ? new Date(rawData.birthday) : undefined,
    };


    // --- START MAP TAGS ---

    // ✅ MAPPING DICTIONARIES
    const levelNameToCode: Record<string, string> = {
      'Lớp 10': 'grade10',
      'Lớp 11': 'grade11',
      'Lớp 12': 'grade12',
      'Grade 10': 'grade10',
      'Grade 11': 'grade11',
      'Grade 12': 'grade12'
    };

    const subjectNameToCode: Record<string, string> = {
      'Toán học': 'math',
      'Vật lý': 'physics',
      'Hóa học': 'chemistry',
      'Sinh học': 'biology',
      'Tiếng Anh': 'english',
      'Tin học': 'computer',
      'Mathematics': 'math',
      'Physics': 'physics',
      'Chemistry': 'chemistry',
      'Biology': 'biology',
      'English': 'english',
      'Computer Science': 'computer'
    };

    const genderNameToCode: Record<string, string> = {
      'Nam': 'male',
      'Nữ': 'female',
      'Khác': 'other',
      'Male': 'male',
      'Female': 'female',
      'Non-binary': 'other',
      'Other': 'other'
    };

    const styleNameToCode: Record<string, string> = {
      'Học bằng hình ảnh': 'visual',
      'Học bằng âm thanh': 'auditory',
      'Học bằng thực hành': 'kinesthetic',
      'Học bằng đọc': 'reading',
      'Học nhóm': 'group',
      'Học cá nhân': 'individual',
      'Visual': 'visual',
      'Auditory': 'auditory',
      'Kinesthetic': 'kinesthetic',
      'Reading': 'reading',
      'Group': 'group',
      'Individual': 'individual'
    };

    const goalNameToCode: Record<string, string> = {
      'Thi cử': 'exam',
      'Cải thiện điểm số': 'improve',
      'Hiểu sâu kiến thức': 'understand',
      'Luyện tập': 'practice',
      'Ôn tập': 'review',
      'Làm bài tập': 'homework',
      'Exam': 'exam',
      'Improve': 'improve',
      'Understand': 'understand',
      'Practice': 'practice',
      'Review': 'review',
      'Homework': 'homework'
    };


    // ✅ MAP GRADE LEVEL
    if (rawData.gradeLevel) {
      const code = levelNameToCode[rawData.gradeLevel] || rawData.gradeLevel.toLowerCase();
      const name = code === 'grade10' ? 'Grade 10' : code === 'grade11' ? 'Grade 11' : code === 'grade12' ? 'Grade 12' : code;
      profileUpdateData.tagLevel = { connectOrCreate: { where: { code }, create: { code, name } } };
    }

    // ✅ MAP SUBJECT
    if (rawData.subjects && rawData.subjects.length > 0) {
      const realSubject = rawData.subjects.find((s: string) => s !== 'General');
      const subjectName = realSubject || rawData.subjects[0];
      const code = subjectNameToCode[subjectName] || subjectName.toLowerCase();
      const nameMap: Record<string, string> = {
        'math': 'Mathematics',
        'physics': 'Physics',
        'chemistry': 'Chemistry',
        'biology': 'Biology',
        'english': 'English',
        'computer': 'Computer Science'
      };
      const name = nameMap[code] || code;
      profileUpdateData.tagSubject = { connectOrCreate: { where: { code }, create: { code, name } } };
    }

    // ✅ MAP GENDER
    if (rawData.gender) {
      const genderMap: Record<string, Gender> = {
        'Male': Gender.MALE,
        'Nam': Gender.MALE,
        'Female': Gender.FEMALE,
        'Nữ': Gender.FEMALE,
        'Non-binary': Gender.OTHER,
        'Khác': Gender.OTHER,
        'Other': Gender.OTHER
      };
      profileUpdateData.gender = genderMap[rawData.gender] || Gender.PREFER_NOT_TO_SAY;

      const genderCode = genderNameToCode[rawData.gender] || rawData.gender.toLowerCase();
      const genderNameMap: Record<string, string> = { 'male': 'Male', 'female': 'Female', 'other': 'Other' };
      const genderDisplayName = genderNameMap[genderCode] || genderCode;
      profileUpdateData.tagGender = { connectOrCreate: { where: { code: genderCode }, create: { code: genderCode, name: genderDisplayName } } };
    }

    // ✅ MAP STUDY STYLE
    if (rawData.studyStyle?.length) {
      const styleInput = Array.isArray(rawData.studyStyle) ? rawData.studyStyle[0] : rawData.studyStyle;
      const styleName = styleInput.split(',')[0].trim();
      const code = styleNameToCode[styleName] || styleName.toLowerCase();
      const styleDisplayMap: Record<string, string> = {
        'visual': 'Visual',
        'auditory': 'Auditory',
        'kinesthetic': 'Kinesthetic',
        'reading': 'Reading',
        'group': 'Group',
        'individual': 'Individual'
      };
      const name = styleDisplayMap[code] || code;
      profileUpdateData.tagStudyStyle = { connectOrCreate: { where: { code }, create: { code, name } } };
    }

    // ✅ MAP LEARNING GOAL
    if (rawData.learningGoals?.length) {
      const goalName = rawData.learningGoals[0];
      const code = goalNameToCode[goalName] || goalName.toLowerCase();
      const goalDisplayMap: Record<string, string> = {
        'exam': 'Exam Preparation',
        'improve': 'Improve Grades',
        'understand': 'Deep Understanding',
        'practice': 'Practice',
        'review': 'Review',
        'homework': 'Homework'
      };
      const name = goalDisplayMap[code] || code;
      profileUpdateData.tagLearningGoal = { connectOrCreate: { where: { code }, create: { code, name } } };
    }


    // 4. TRANSACTION
    try {
      console.log('🔥 [DEBUG] Starting transaction...');
      console.log('🔥 [DEBUG] profileUpdateData:', JSON.stringify(profileUpdateData, null, 2));

      await this.prisma.$transaction(async (tx) => {
        console.log('🔥 [DEBUG] Inside transaction, updating user...');

        await tx.user.update({
          where: { id },
          data: {
            // Do not send fullName into User to avoid crash
            profile: {
              upsert: {
                create: {
                  ...profileUpdateData,
                  username: fullName || "user",
                  usernameCode: `u${Date.now()}`,

                  // Safe fallback
                  tagSubject: profileUpdateData.tagSubject || { connectOrCreate: { where: { code: 'math' }, create: { code: 'math', name: 'Mathematics' } } },
                  tagLevel: profileUpdateData.tagLevel || { connectOrCreate: { where: { code: 'grade10' }, create: { code: 'grade10', name: 'Grade 10' } } },
                },
                update: profileUpdateData
              }
            }
          }
        });

        console.log('🔥 [DEBUG] User updated successfully!');

        // Update Schedule
        if (rawData.studySchedule) {
          const { days, time } = rawData.studySchedule;
          console.log('🔥 [DEBUG] Updating schedule:', { days, time });

          await tx.userStudySlot.deleteMany({ where: { userId: id } });

          const daysArr = Array.isArray(days) ? days : [];
          const timeArr = typeof time === 'string' ? time.split(',').map(t => t.trim()) : (Array.isArray(time) ? time : []);

          // ✅ MAP DISPLAY NAMES TO CODES
          const dayNameToCode: Record<string, string> = {
            'Thứ 2': 'monday', 'Thứ 3': 'tuesday', 'Thứ 4': 'wednesday', 'Thứ 5': 'thursday',
            'Thứ 6': 'friday', 'Thứ 7': 'saturday', 'Chủ nhật': 'sunday',
            'Monday': 'monday', 'Tuesday': 'tuesday', 'Wednesday': 'wednesday',
            'Thursday': 'thursday', 'Friday': 'friday', 'Saturday': 'saturday', 'Sunday': 'sunday'
          };

          const timeNameToCode: Record<string, string> = {
            'Sáng (6h-12h)': 'morning', 'Chiều (12h-18h)': 'afternoon', 'Tối (18h-22h)': 'evening', 'Đêm (22h-6h)': 'night',
            'Morning (6am-12pm)': 'morning', 'Afternoon (12pm-6pm)': 'afternoon', 'Evening (6pm-9pm)': 'evening', 'Night (9pm-6am)': 'night',
            'Morning': 'morning', 'Afternoon': 'afternoon', 'Evening': 'evening', 'Night': 'night'
          };

          // ✅ DEDUPLICATE COMBINATIONS FIRST (Fix Transaction Abort)
          const uniqueSlots = new Set<string>();
          const validSlots: { dayCode: string, timeCode: string, dayName: string, timeName: string }[] = [];

          const dayDisplayMap: Record<string, string> = {
            'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
            'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
          };
          const timeDisplayMap: Record<string, string> = {
            'morning': 'Morning (6am-12pm)', 'afternoon': 'Afternoon (12pm-6pm)',
            'evening': 'Evening (6pm-9pm)', 'night': 'Night (9pm-6am)'
          };

          for (const d of daysArr) {
            for (const t of timeArr) {
              const dayBaseName = d.trim().split('(')[0].trim();
              const timeBaseName = t.trim().split('(')[0].trim();

              const dayCode = dayNameToCode[d] || dayNameToCode[dayBaseName] || dayBaseName.toLowerCase();
              const timeCode = timeNameToCode[t] || timeNameToCode[timeBaseName] || timeBaseName.toLowerCase();

              const key = `${dayCode}|${timeCode}`;
              if (!uniqueSlots.has(key)) {
                uniqueSlots.add(key);
                validSlots.push({
                  dayCode,
                  timeCode,
                  dayName: dayDisplayMap[dayCode] || dayCode,
                  timeName: timeDisplayMap[timeCode] || timeCode
                });
              }
            }
          }

          console.log(`🔥 [DEBUG] Found ${validSlots.length} unique slots to create`);

          // ✅ EXECUTE QUERIES SEQUENTIALLY
          for (const slot of validSlots) {
            const tagDay = await tx.tagStudyDay.upsert({
              where: { code: slot.dayCode },
              create: { code: slot.dayCode, name: slot.dayName },
              update: {}
            });

            const tagTime = await tx.tagStudyTime.upsert({
              where: { code: slot.timeCode },
              create: { code: slot.timeCode, name: slot.timeName },
              update: {}
            });

            // No catch() here - fail fast if error!
            await tx.userStudySlot.create({
              data: { userId: id, tagStudyDayId: tagDay.id, tagStudyTimeId: tagTime.id }
            });
          }
        }
      });

      console.log('🔥 [DEBUG] Transaction completed successfully!');


      // 🔥 SYNC TO MONGODB (CHAT USER MODEL) - DISABLED AFTER REVERT
      // UserModel no longer exists, this sync is not needed
      /*
      try {
        console.log('🔥 [DEBUG] Syncing to MongoDB User...', { userId: id, name: fullName, avatar: finalAvatarUrl });
        const updatePayload: any = {};
        if (fullName) updatePayload.name = fullName;
        if (finalAvatarUrl) updatePayload.avatar = finalAvatarUrl;

        if (Object.keys(updatePayload).length > 0) {
          await UserModel.findOneAndUpdate(
            { userId: id },
            { $set: updatePayload },
            { upsert: true, new: true }
          );
          console.log('✅ [DEBUG] Synced to MongoDB successfully');
        }
      } catch (error) {
        console.error("❌ [ERROR] Failed to sync to MongoDB:", error);
      }
      */


    } catch (error) {
      console.error('❌ [ERROR] Transaction failed:', error);
      console.error('❌ [ERROR] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    return this.findOne(id);
  }

  // =========================================================

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createVerifyCode(userId: string, code: string, type: string) {
    await this.prisma.verifyCode.deleteMany({ where: { userId, type } });
    return this.prisma.verifyCode.create({
      data: {
        userId,
        code,
        type,
        expiredAt: new Date(Date.now() + 15 * 60000),
      },
    });
  }

  async findValidVerifyCode(code: string, type: string) {
    return this.prisma.verifyCode.findFirst({
      where: {
        code,
        type,
        usedAt: null,
        expiredAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async markEmailAsVerified(userId: string, codeId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
    await this.prisma.verifyCode.update({
      where: { id: codeId },
      data: { usedAt: new Date() },
    });
  }

  async updateResetToken(email: string, token: string, expiry: Date) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    await this.prisma.verifyCode.deleteMany({
      where: { userId: user.id, type: 'RESET_PASSWORD' },
    });
    return this.prisma.verifyCode.create({
      data: {
        userId: user.id,
        code: token,
        type: 'RESET_PASSWORD',
        expiredAt: expiry,
      },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    const codeRecord = await this.prisma.verifyCode.findFirst({
      where: {
        code: token,
        type: 'RESET_PASSWORD',
        usedAt: null,
        expiredAt: { gt: new Date() },
      },
      include: { user: true },
    });
    return codeRecord ? codeRecord.user : null;
  }

  async updatePassword(userId: string, newHash: string) {
    await this.prisma.verifyCode.updateMany({
      where: { userId, type: 'RESET_PASSWORD', usedAt: null },
      data: { usedAt: new Date() },
    });
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: newHash },
    });
  }

  async updateFailedLogin(userId: string, attempts: number, lockUntil: Date | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockUntil: lockUntil,
      },
    });
  }

  async resetLoginAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });
  }

  // =========================================================
  // API cho ML Server: Lấy tất cả users để matching
  // =========================================================
  async findAllForMatching() {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        profile: {
          isNot: null,
        },
      },
      include: {
        profile: {
          include: {
            tagSubject: true,
            tagLevel: true,
            tagGender: true,
            tagStudyStyle: true,
            tagLearningGoal: true,
            tagStudyDay: true,
            tagStudyTime: true,
          },
        },
        studySlots: {
          include: {
            tagStudyDay: true,
            tagStudyTime: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 [Service] Returning ${users.length} users for ML matching`);

    // Transform to ML server format
    return users.map(user => {
      // Extract grade number from tagLevel name (e.g., "Grade 10" -> "10")
      let gradeValue = '';
      if (user.profile?.tagLevel?.name) {
        const match = user.profile.tagLevel.name.match(/\d+/);
        gradeValue = match ? match[0] : '11'; // Default to 11 if no number found
      }

      return {
        user_id: user.id,
        name: user.profile?.username || user.email.split('@')[0],
        email: user.email,
        school: user.profile?.school || '',
        grade: gradeValue || '11', // Return numeric string: "10", "11", or "12"
        bio: user.profile?.bio || '',

        // Tags chính
        tag_subject: user.profile?.tagSubject?.name || '',
        tag_study_days: user.studySlots.map(slot => slot.tagStudyDay?.name).filter(Boolean),
        tag_study_times: user.studySlots.map(slot => slot.tagStudyTime?.name).filter(Boolean),

        // Tags phụ
        tag_study_style: user.profile?.tagStudyStyle?.name || '',
        tag_learning_goal: user.profile?.tagLearningGoal?.name || '',
      };
    });
  }

  /**
   * Upload multiple profile photos (base64 strings)
   * Saves files to disk and creates ProfilePhoto records
   * NOTE: This will REPLACE all existing photos (delete old ones first)
   */
  async uploadProfilePhotos(userId: string, photos: string[]): Promise<any> {
    try {
      // Get user's profile ID
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!user || !user.profile) {
        throw new Error('Profile not found');
      }

      const profileId = user.profile.id;

      // ✅ FIX: Delete all existing photos first to prevent duplicates
      await this.prisma.profilePhoto.deleteMany({
        where: { profileId },
      });

      // Filter out photos that are already URLs (from database), only process new base64 images
      const newPhotos = photos.filter(photo =>
        photo.startsWith('data:image') || !photo.startsWith('http')
      );
      const existingUrls = photos.filter(photo =>
        photo.startsWith('http')
      );

      // Re-create records for existing URLs (to preserve order)
      const savedPhotos = [];
      let orderIndex = 0;

      // First, add back existing URLs
      for (const url of existingUrls) {
        const photo = await this.prisma.profilePhoto.create({
          data: {
            profileId,
            photoUrl: url,
            order: orderIndex++,
          },
        });
        savedPhotos.push(photo);
      }

      // Then save new base64 photos to disk and create records
      for (const photo of newPhotos) {
        const photoUrl = this.saveAvatarToFile(photo);
        if (photoUrl) {
          const photoRecord = await this.prisma.profilePhoto.create({
            data: {
              profileId,
              photoUrl,
              order: orderIndex++,
            },
          });
          savedPhotos.push(photoRecord);
        }
      }

      return {
        success: true,
        message: `Uploaded ${savedPhotos.length} photos`,
        photos: savedPhotos,
      };
    } catch (error) {
      console.error('Error uploading profile photos:', error);
      throw error;
    }
  }

  /**
   * Get all profile photos for a user
   */
  async getProfilePhotos(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: {
            include: {
              photos: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
        },
      });

      if (!user || !user.profile) {
        return [];
      }

      // Convert file paths to full URLs
      const photos = user.profile.photos.map(photo => ({
        ...photo,
        photoUrl: photo.photoUrl.startsWith('/uploads')
          ? `http://localhost:8888${photo.photoUrl}`
          : photo.photoUrl,
      }));

      return photos; // Return array directly
    } catch (error) {
      console.error('Error fetching profile photos:', error);
      return [];
    }
  }

  /**
   * Delete a profile photo
   */
  async deleteProfilePhoto(userId: string, photoId: string): Promise<any> {
    try {
      // Verify ownership
      const photo = await this.prisma.profilePhoto.findUnique({
        where: { id: photoId },
        include: {
          profile: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!photo || photo.profile.userId !== userId) {
        throw new Error('Photo not found or unauthorized');
      }

      // Delete file from disk if it exists
      if (photo.photoUrl.startsWith('/uploads')) {
        const filePath = path.join(process.cwd(), photo.photoUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete from database
      await this.prisma.profilePhoto.delete({
        where: { id: photoId },
      });

      return {
        success: true,
        message: 'Photo deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      throw error;
    }
  }
  /**
   * Get user account status (warnings, ban status)
   */
  async getAccountStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        warnCount: true,
        lastViolationAt: true,
        isActive: true,
        bannedUntil: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let daysUntilReset = null;
    let isClean = true;

    if (user.warnCount > 0 && user.lastViolationAt) {
      const now = new Date();
      const lastViolation = new Date(user.lastViolationAt);
      const daysSinceLastViolation = Math.floor(
        (now.getTime() - lastViolation.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Warning resets after 30 days
      if (daysSinceLastViolation < 30) {
        daysUntilReset = 30 - daysSinceLastViolation;
        isClean = false;
      } else {
        // Logically cleaned but maybe not updated in DB yet
        // If DB update happens lazily on next violation, we just show 0 days here
        daysUntilReset = 0;
        isClean = true;
      }
    }

    return {
      warnCount: user.warnCount,
      lastViolationAt: user.lastViolationAt,
      daysUntilReset,
      isClean,
      isActive: user.isActive,
      bannedUntil: user.bannedUntil,
    };
  }
}

