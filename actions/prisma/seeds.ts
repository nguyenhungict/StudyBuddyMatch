import { PrismaClient, RoleName, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to generate random date between two dates
function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// Helper function to hash password with bcrypt (matches auth.service.ts)
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Helper function to generate random item from array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random items from array (multiple)
function randomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function clearData() {
  console.log('🗑️  Đang xóa dữ liệu cũ...');

  // Delete in correct order (respecting foreign keys)
  // 1. Delete child tables first
  await prisma.notification.deleteMany({});
  await prisma.moderationLog.deleteMany({});
  await prisma.moderation.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.call.deleteMany({});
  await prisma.conversation.deleteMany({});

  await prisma.verifyCode.deleteMany({});

  // 2. Delete user-related data
  await prisma.userStudySlot.deleteMany({});


  // 3. Delete swipes and matches
  await prisma.match.deleteMany({});
  await prisma.swipe.deleteMany({});

  // 4. Delete profiles and users
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  // 5. Delete lookup tables (tags)
  await prisma.tagSubject.deleteMany({});
  await prisma.tagLevel.deleteMany({});
  await prisma.tagGender.deleteMany({});
  await prisma.tagStudyStyle.deleteMany({});
  await prisma.tagLearningGoal.deleteMany({});
  await prisma.tagStudyDay.deleteMany({});
  await prisma.tagStudyTime.deleteMany({});

  // 6. Delete roles and other system tables
  await prisma.violationKeyword.deleteMany({});
  await prisma.role.deleteMany({});

  console.log('✅ Đã xóa hết dữ liệu cũ!\n');
}

async function seedTags() {
  console.log('🌱 Đang seed các tag tables...');

  // Seed Roles

  const userRole = await prisma.role.create({
    data: {
      name: 'USER',
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
    },
  });

  // Seed Tag Subjects (6 main high school subjects)
  const subjects = [
    { code: 'math', name: 'Mathematics' },
    { code: 'physics', name: 'Physics' },
    { code: 'chemistry', name: 'Chemistry' },
    { code: 'biology', name: 'Biology' },
    { code: 'english', name: 'English' },
    { code: 'computer', name: 'Computer Science' },
  ];

  // const dataToCreate = subjects.map(tag => {
  //   return {
  //     code: tag.code,
  //     name: tag.name
  //   }
  // })
  // const tagSubjects = await prisma.tagSubject.createMany({
  //   data: dataToCreate
  // })

  // console.log("tagSubjects",tagSubjects)

  const tagSubjects = await Promise.all(
    subjects.map((subject) =>
      prisma.tagSubject.create({
        data: subject,
      }),
    ),
  );

  // Seed Tag Levels (High school: grade 10, 11, 12)
  const levels = [
    { code: 'grade10', name: 'Grade 10' },
    { code: 'grade11', name: 'Grade 11' },
    { code: 'grade12', name: 'Grade 12' },
  ];

  const tagLevels = await Promise.all(
    levels.map((level) =>
      prisma.tagLevel.create({
        data: level,
      }),
    ),
  );

  // Seed Tag Genders
  const genders = [
    { code: 'male', name: 'Male' },
    { code: 'female', name: 'Female' },
    { code: 'other', name: 'Other' },
  ];

  const tagGenders = await Promise.all(
    genders.map((gender) =>
      prisma.tagGender.create({
        data: gender,
      }),
    ),
  );

  // Seed Tag Study Styles
  const studyStyles = [
    { code: 'visual', name: 'Visual' },
    { code: 'auditory', name: 'Auditory' },
    { code: 'kinesthetic', name: 'Kinesthetic' },
    { code: 'reading', name: 'Reading' },
    { code: 'group', name: 'Group' },
    { code: 'individual', name: 'Individual' },
  ];

  const tagStudyStyles = await Promise.all(
    studyStyles.map((style) =>
      prisma.tagStudyStyle.create({
        data: style,
      }),
    ),
  );

  // Seed Tag Learning Goals
  const learningGoals = [
    { code: 'exam', name: 'Exam Preparation' },
    { code: 'improve', name: 'Improve Grades' },
    { code: 'understand', name: 'Deep Understanding' },
    { code: 'practice', name: 'Practice' },
    { code: 'review', name: 'Review' },
    { code: 'homework', name: 'Homework' },
  ];

  const tagLearningGoals = await Promise.all(
    learningGoals.map((goal) =>
      prisma.tagLearningGoal.create({
        data: goal,
      }),
    ),
  );

  // Seed Tag Study Days
  const studyDays = [
    { code: 'monday', name: 'Monday' },
    { code: 'tuesday', name: 'Tuesday' },
    { code: 'wednesday', name: 'Wednesday' },
    { code: 'thursday', name: 'Thursday' },
    { code: 'friday', name: 'Friday' },
    { code: 'saturday', name: 'Saturday' },
    { code: 'sunday', name: 'Sunday' },
  ];

  const tagStudyDays = await Promise.all(
    studyDays.map((day) =>
      prisma.tagStudyDay.create({
        data: day,
      }),
    ),
  );

  // Seed Tag Study Times
  const studyTimes = [
    { code: 'morning', name: 'Morning (6am-12pm)' },
    { code: 'afternoon', name: 'Afternoon (12pm-6pm)' },
    { code: 'evening', name: 'Evening (6pm-9pm)' },
    { code: 'night', name: 'Night (9pm-6am)' },
  ];

  const tagStudyTimes = await Promise.all(
    studyTimes.map((time) =>
      prisma.tagStudyTime.create({
        data: time,
      }),
    ),
  );

  console.log('✅ Đã seed xong các tag tables!');

  return {
    userRole,
    adminRole,
    tagSubjects,
    tagLevels,
    tagGenders,
    tagStudyStyles,
    tagLearningGoals,
    tagStudyDays,
    tagStudyTimes,
  };
}

type TagsData = {
  userRole: { id: string };
  adminRole: { id: string };
  tagSubjects: Array<{ id: string; code: string; name: string }>;
  tagLevels: Array<{ id: string; code: string; name: string }>;
  tagGenders: Array<{ id: string; code: string; name: string }>;
  tagStudyStyles: Array<{ id: string; code: string; name: string }>;
  tagLearningGoals: Array<{ id: string; code: string; name: string }>;
  tagStudyDays: Array<{ id: string; code: string; name: string }>;
  tagStudyTimes: Array<{ id: string; code: string; name: string }>;
};

async function seedUsers(tags: TagsData, count: number = 500) {
  console.log(`👥 Đang seed ${count} users...`);

  const firstNames = [
    'An', 'Bình', 'Cường', 'Dũng', 'Em', 'Giang', 'Hạnh', 'Hùng', 'Khang', 'Lan',
    'Linh', 'Mai', 'Nam', 'Nga', 'Phong', 'Quang', 'Sơn', 'Thảo', 'Tuấn', 'Uyên',
    'Vân', 'Vy', 'Xuân', 'Yến', 'Anh', 'Bảo', 'Chi', 'Đức', 'Hoa', 'Kiên',
  ];

  const lastNames = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
    'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Tô', 'Lương',
  ];

  const schools = [
    'THPT Nguyễn Gia Thiều', 'THPT Chu Văn An', 'THPT Phan Đình Phùng',
    'THPT Lê Quý Đôn', 'THPT Trần Phú', 'THPT Kim Liên',
    'THPT Amsterdam', 'THPT Nhân Chính', 'THPT Chuyên KHTN',
    'THPT Nguyễn Du', 'THPT Lê Hồng Phong', 'THPT Trần Đại Nghĩa',
  ];

  const bios = [
    'Mình thích học nhóm và chia sẻ kiến thức!',
    'Tìm bạn học cùng để cùng tiến bộ 💪',
    'Yêu thích toán học và muốn tìm bạn học chung',
    'Học để hiểu, không chỉ để thi!',
    'Tìm study buddy để cùng nhau phát triển',
    'Thích học qua thảo luận và trao đổi',
    'Muốn tìm bạn cùng mục tiêu học tập',
    'Học tập là niềm vui khi có bạn đồng hành',
  ];

  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const fullName = `${lastName} ${firstName}`;
    const email = `user${i + 1}@studybuddymatch.com`;
    const usernameCode = `user${i + 1}`;
    const password = await hashPassword('password123'); // Tất cả users có cùng password: password123

    // Random birthday (18-25 years old)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 25);
    const birthday = randomDate(minDate, maxDate);

    // Random gender
    const genderText = randomItem(['Nam', 'Nữ', 'Khác']);
    const gender: Gender = genderText === 'Nam' ? Gender.MALE : genderText === 'Nữ' ? Gender.FEMALE : Gender.OTHER;
    const tagGender = tags.tagGenders.find((g) => {
      if (genderText === 'Nam') return g.code === 'male';
      if (genderText === 'Nữ') return g.code === 'female';
      return g.code === 'other';
    });

    if (!tagGender) {
      throw new Error('Tag gender not found');
    }

    // Random selections
    const tagLevel = randomItem(tags.tagLevels);
    const tagSubject = randomItem(tags.tagSubjects);
    const tagLearningGoal = randomItem(tags.tagLearningGoals);
    const tagStudyStyle = randomItem(tags.tagStudyStyles);

    // ✅ PRIMARY selections (for display in profile)
    const primaryStudyDay = randomItem(tags.tagStudyDays);
    const primaryStudyTime = randomItem(tags.tagStudyTimes);

    const user = await prisma.user.create({
      data: {
        email,
        password,
        isActive: true,
        roleId: tags.userRole.id,
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            usernameCode,
            username: fullName,
            gender,
            birthday,
            bio: randomItem(bios),
            school: Math.random() > 0.3 ? randomItem(schools) : null,
            achievement: Math.random() > 0.5 ? 'Đạt giải trong các kỳ thi học sinh giỏi' : null,
            tagLevelId: tagLevel.id,
            tagSubjectId: tagSubject.id,
            tagLearningGoalId: tagLearningGoal.id,
            tagStudyStyleId: tagStudyStyle.id,
            tagStudyDayId: primaryStudyDay.id,
            tagStudyTimeId: primaryStudyTime.id,
            tagGenderId: tagGender.id,
          },
        },
      },
    });

    // ✅ CREATE MULTIPLE STUDY SLOTS (2-4 days, 2-3 time blocks)
    const numDays = Math.floor(Math.random() * 3) + 2; // 2-4 days
    const numTimes = Math.floor(Math.random() * 2) + 2; // 2-3 time blocks

    const selectedDays = randomItems(tags.tagStudyDays, numDays);
    const selectedTimes = randomItems(tags.tagStudyTimes, numTimes);

    // Create slots for each combination
    for (const day of selectedDays) {
      for (const time of selectedTimes) {
        await prisma.userStudySlot.create({
          data: {
            userId: user.id,
            tagStudyDayId: day.id,
            tagStudyTimeId: time.id,
          },
        });
      }
    }

    users.push(user);

    if ((i + 1) % 50 === 0) {
      console.log(`  ✅ Đã tạo ${i + 1}/${count} users...`);
    }
  }

  console.log(`✅ Đã seed xong ${count} users với profiles!`);
  return users;
}

async function seedAdminUser(tags: TagsData) {
  console.log('👑 Đang tạo tài khoản admin...');

  const adminEmail = 'admin@studybuddy.com';
  const adminPassword = await hashPassword('Admin@123');

  // Kiểm tra xem admin đã tồn tại chưa
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('⚠️  Tài khoản admin đã tồn tại, bỏ qua...');
    return existingAdmin;
  }

  // Tạo admin user
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      password: adminPassword,
      isActive: true,
      roleId: tags.adminRole.id, // Lấy từ tags đã seed
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          usernameCode: 'admin',
          username: 'Administrator',
          gender: Gender.OTHER,
          birthday: new Date('1990-01-01'),
          bio: 'System Administrator',
          school: null,
          achievement: null,
          tagLevelId: tags.tagLevels[0].id,
          tagSubjectId: tags.tagSubjects[0].id,
          tagLearningGoalId: tags.tagLearningGoals[0].id,
          tagStudyStyleId: tags.tagStudyStyles[0].id,
          tagStudyDayId: tags.tagStudyDays[0].id,
          tagStudyTimeId: tags.tagStudyTimes[0].id,
          tagGenderId: tags.tagGenders[2].id, // 'other'
        },
      },
    },
  });

  console.log('✅ Đã tạo tài khoản admin!');
  console.log(`   📧 Email: ${adminEmail}`);
  console.log(`   🔑 Password: Admin@123`);

  return adminUser;
}

async function seedSwipes(users: Array<{ id: string }>) {
  console.log('💫 Đang seed swipe data để test matching...');

  const swipeCount = Math.min(500, users.length * 3); // Tối đa 500 swipes
  let created = 0;

  for (let i = 0; i < swipeCount; i++) {
    const swiper = randomItem(users);
    let target = randomItem(users);

    // Đảm bảo swiper và target khác nhau
    while (target.id === swiper.id) {
      target = randomItem(users);
    }

    // Random like (70% chance to like)
    const isLike = Math.random() > 0.3;

    try {
      await prisma.swipe.create({
        data: {
          swiperId: swiper.id,
          targetId: target.id,
          isLike,
        },
      });
      created++;
    } catch (error) {
      // Ignore duplicate swipes
    }
  }

  console.log(`✅ Đã seed ${created} swipes!`);
}

async function initSeeds() {
  console.log('🚀 Bắt đầu seed database...\n');

  // ✅ AUTO CLEANUP (để teammates chỉ cần chạy npm run seeds)
  await clearData();

  // ✅ AUTO SEED TAGS (tạo tags chuẩn)
  const tags = await seedTags();

  // ✅ CREATE ADMIN USER
  await seedAdminUser(tags);

  // Seed users (500 users mặc định, có thể thay đổi)
  const users = await seedUsers(tags, 500);

  // Seed một số swipes để test matching
  await seedSwipes(users);

  console.log('\n🎉 Hoàn thành seed database!');
  console.log(`📊 Tổng kết:`);
  console.log(`   - Admin: 1 (admin@studybuddy.com / Admin@123)`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Tất cả users có password: password123`);
  console.log(`   - Email format: user1@studybuddymatch.com, user2@studybuddymatch.com, ...`);
}

initSeeds()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });