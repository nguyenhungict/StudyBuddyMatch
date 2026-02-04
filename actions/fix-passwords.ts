import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixPasswords() {
    console.log('🔧 Bắt đầu fix password cho tất cả users...\n');

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`📝 Password mới (bcrypt hash): ${hashedPassword.substring(0, 30)}...\n`);

    // Get all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
        },
    });

    console.log(`👥 Tìm thấy ${users.length} users\n`);

    // Update all users
    let updated = 0;
    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        updated++;

        if (updated % 50 === 0) {
            console.log(`  ✅ Đã update ${updated}/${users.length} users...`);
        }
    }

    console.log(`\n✅ Hoàn thành! Đã update password cho ${updated} users`);
    console.log(`\n🔑 Tất cả users giờ có thể login với:`);
    console.log(`   Password: password123`);
    console.log(`\n📧 Test login với:`);
    console.log(`   Email: user1@studybuddymatch.com`);
    console.log(`   Email: user102@studybuddymatch.com`);
    console.log(`   ... (bất kỳ user nào từ 1-150)`);
}

fixPasswords()
    .catch((e) => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
