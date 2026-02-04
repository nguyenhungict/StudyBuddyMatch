import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unseedMockAdminData() {
    console.log('🧹 Starting to remove mock admin data...');

    try {
        // Count before deletion
        const moderationCount = await prisma.moderation.count();
        const keywordCount = await prisma.violationKeyword.count();

        console.log('📊 Current data:');
        console.log(`   - ${moderationCount} moderation reports`);
        console.log(`   - ${keywordCount} violation keywords`);
        console.log('');

        // 1. Delete all moderation reports
        console.log('🗑️  Deleting moderation reports...');
        const deletedModerations = await prisma.moderation.deleteMany({});
        console.log(`✅ Deleted ${deletedModerations.count} moderation reports`);

        // 2. Delete all moderation logs (if any)
        console.log('🗑️  Deleting moderation logs...');
        const deletedLogs = await prisma.moderationLog.deleteMany({});
        console.log(`✅ Deleted ${deletedLogs.count} moderation logs`);

        // 3. Delete all violation keywords
        console.log('🗑️  Deleting violation keywords...');
        const deletedKeywords = await prisma.violationKeyword.deleteMany({});
        console.log(`✅ Deleted ${deletedKeywords.count} violation keywords`);

        console.log('');
        console.log('✨ Mock admin data removed successfully!');
        console.log('');
        console.log('💡 To seed again, run: npm run seed:mock');

    } catch (error) {
        console.error('❌ Error removing mock admin data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

unseedMockAdminData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
