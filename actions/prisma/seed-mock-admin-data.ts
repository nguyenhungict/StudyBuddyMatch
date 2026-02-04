    import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMockAdminData() {
    console.log('🌱 Starting to seed mock admin data...');

    try {
        // Get some existing users to use as targets and reporters
        const users = await prisma.user.findMany({
            take: 10,
            include: { profile: true },
        });

        if (users.length < 5) {
            console.error('❌ Not enough users in database. Please run the main seed first.');
            process.exit(1);
        }

        // 1. Seed Violation Keywords
        console.log('📝 Seeding violation keywords...');
        const violationKeywords = [
            // SPAM keywords
            { text: 'spam', type: 'SPAM' },
            { text: 'quảng cáo', type: 'SPAM' },
            { text: 'click here', type: 'SPAM' },
            { text: 'buy now', type: 'SPAM' },
            { text: 'free money', type: 'SPAM' },

            // HATE_SPEECH keywords
            { text: 'hate', type: 'HATE_SPEECH' },
            { text: 'ghét', type: 'HATE_SPEECH' },
            { text: 'kỳ thị', type: 'HATE_SPEECH' },
            { text: 'phân biệt', type: 'HATE_SPEECH' },

            // HARASSMENT keywords
            { text: 'quấy rối', type: 'HARASSMENT' },
            { text: 'đe dọa', type: 'HARASSMENT' },
            { text: 'harass', type: 'HARASSMENT' },
            { text: 'bully', type: 'HARASSMENT' },
        ];

        const createdKeywords = [];
        for (const keyword of violationKeywords) {
            const created = await prisma.violationKeyword.upsert({
                where: {
                    text_type: {
                        text: keyword.text,
                        type: keyword.type
                    }
                },
                update: {},
                create: {
                    text: keyword.text,
                    type: keyword.type
                },
            });
            createdKeywords.push(created);
        }
        console.log(`✅ Created ${createdKeywords.length} violation keywords`);

        // 2. Seed Moderation Reports
        console.log('📊 Seeding moderation reports...');

        const mockReports = [
            {
                type: 'SPAM',
                source: 'USER_REPORT',
                targetId: users[0].id,
                reporterId: users[1].id,
                status: 'PENDING',
                action: 'NONE',
                reason: 'Tin nhắn chứa nhiều link spam và nội dung quảng cáo',
                violationCount: 2,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
            {
                type: 'HATE_SPEECH',
                source: 'SYSTEM_SCAN',
                targetId: users[1].id,
                reporterId: null,
                status: 'PENDING',
                action: 'NONE',
                reason: 'Phát hiện từ ngữ kỳ thị và lời nói ghét',
                violationCount: 4,
                violationWordId: createdKeywords.find(k => k.type === 'HATE_SPEECH')?.id,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
            },
            {
                type: 'HARASSMENT',
                source: 'USER_REPORT',
                targetId: users[2].id,
                reporterId: users[3].id,
                status: 'PENDING',
                action: 'NONE',
                reason: 'Người dùng liên tục gửi tin nhắn quấy rối và đe dọa',
                violationCount: 5,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
            {
                type: 'INAPPROPRIATE_CONTENT',
                source: 'USER_REPORT',
                targetId: users[3].id,
                reporterId: users[4].id,
                status: 'RESOLVED',
                action: 'WARN',
                reason: 'Bình luận chứa nội dung không phù hợp với cộng đồng',
                violationCount: 1,
                reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
                type: 'SCAM',
                source: 'SYSTEM_SCAN',
                targetId: users[4].id,
                reporterId: null,
                status: 'PENDING',
                action: 'NONE',
                reason: 'Phát hiện nội dung lừa đảo và phishing',
                violationCount: 3,
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            },
            {
                type: 'FAKE_INFORMATION',
                source: 'USER_REPORT',
                targetId: users[5].id,
                reporterId: users[6].id,
                status: 'PENDING',
                action: 'NONE',
                reason: 'Bài viết chứa thông tin sai lệch và không chính xác',
                violationCount: 2,
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            },
            {
                type: 'SPAM',
                source: 'USER_REPORT',
                targetId: users[6].id,
                reporterId: users[7].id,
                status: 'RESOLVED',
                action: 'DELETE_CONTENT',
                reason: 'Tin nhắn spam quảng cáo sản phẩm',
                violationCount: 1,
                reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
            {
                type: 'HARASSMENT',
                source: 'USER_REPORT',
                targetId: users[7].id,
                reporterId: users[8].id,
                status: 'PENDING',
                action: 'NONE',
                reason: 'Bình luận có tính chất quấy rối và xúc phạm',
                violationCount: 3,
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            },
            {
                type: 'SPAM',
                source: 'SYSTEM_SCAN',
                targetId: users[8].id,
                reporterId: null,
                status: 'DISMISSED',
                action: 'NONE',
                reason: 'False positive - không phải spam',
                violationCount: 1,
                reviewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
            {
                type: 'HATE_SPEECH',
                source: 'USER_REPORT',
                targetId: users[9].id,
                reporterId: users[0].id,
                status: 'RESOLVED',
                action: 'BAN',
                reason: 'Vi phạm nghiêm trọng chính sách cộng đồng',
                violationCount: 7,
                reviewedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            },
        ];

        let createdReportsCount = 0;
        for (const report of mockReports) {
            await prisma.moderation.create({
                data: {
                    type: report.type,
                    source: report.source,
                    targetId: report.targetId,
                    reporterId: report.reporterId,
                    status: report.status as any,
                    action: report.action as any,
                    reason: report.reason,
                    violationCount: report.violationCount,
                    violationWordId: report.violationWordId,
                    reviewedAt: report.reviewedAt,
                    createdAt: report.createdAt,
                },
            });
            createdReportsCount++;
        }
        console.log(`✅ Created ${createdReportsCount} moderation reports`);

        console.log('');
        console.log('✨ Mock admin data seeded successfully!');
        console.log('');
        console.log('📊 Summary:');
        console.log(`   - ${createdKeywords.length} violation keywords`);
        console.log(`   - ${createdReportsCount} moderation reports`);
        console.log('');
        console.log('💡 To remove this data, run: npm run unseed:mock');

    } catch (error) {
        console.error('❌ Error seeding mock admin data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedMockAdminData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
