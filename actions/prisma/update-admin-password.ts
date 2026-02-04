import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateAdminPassword() {
    console.log('🔑 Đang cập nhật mật khẩu admin...');

    const adminEmail = 'admin@studybuddy.com';
    const newPassword = 'Admin@123';

    // Hash password bằng bcrypt (giống auth service)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Tìm admin user
    const admin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!admin) {
        console.log('❌ Không tìm thấy tài khoản admin!');
        console.log('   Vui lòng chạy seed trước: npm run seeds');
        return;
    }

    // Cập nhật password
    await prisma.user.update({
        where: { email: adminEmail },
        data: { password: hashedPassword },
    });

    console.log('✅ Đã cập nhật mật khẩu admin thành công!');
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔑 Password: ${newPassword}`);
    console.log('   🔐 Password đã được hash bằng bcrypt (giống user login)');
}

updateAdminPassword()
    .catch((e) => {
        console.error('❌ Lỗi khi cập nhật:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
