// check-database.ts - Script kiểm tra tất cả bảng trong database

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('🔍 KIỂM TRA TOÀN BỘ DATABASE\n');
    console.log('='.repeat(80));

    try {
        // Check Roles
        console.log('\n📋 ROLES:');
        const roles = await prisma.role.findMany();
        console.log(`   Total: ${roles.length}`);
        roles.forEach(r => console.log(`   - ${r.name} (${r.id})`));

        // Check Tag Subjects
        console.log('\n📚 TAG SUBJECTS:');
        const subjects = await prisma.tagSubject.findMany();
        console.log(`   Total: ${subjects.length}`);
        subjects.forEach(s => console.log(`   - ${s.code} | ${s.name}`));
        if (subjects.length !== 6) console.log('   ⚠️  WARNING: Should have exactly 6 subjects!');

        // Check Tag Levels
        console.log('\n🎓 TAG LEVELS:');
        const levels = await prisma.tagLevel.findMany();
        console.log(`   Total: ${levels.length}`);
        levels.forEach(l => console.log(`   - ${l.code} | ${l.name}`));
        if (levels.length !== 3) console.log('   ⚠️  WARNING: Should have exactly 3 levels (grade10, 11, 12)!');

        // Check Tag Genders
        console.log('\n👤 TAG GENDERS:');
        const genders = await prisma.tagGender.findMany();
        console.log(`   Total: ${genders.length}`);
        genders.forEach(g => console.log(`   - ${g.code} | ${g.name}`));

        // Check Tag Study Styles
        console.log('\n✏️  TAG STUDY STYLES:');
        const styles = await prisma.tagStudyStyle.findMany();
        console.log(`   Total: ${styles.length}`);
        styles.forEach(s => console.log(`   - ${s.code} | ${s.name}`));

        // Check Tag Learning Goals
        console.log('\n🎯 TAG LEARNING GOALS:');
        const goals = await prisma.tagLearningGoal.findMany();
        console.log(`   Total: ${goals.length}`);
        goals.forEach(g => console.log(`   - ${g.code} | ${g.name}`));

        // Check Tag Study Days
        console.log('\n📅 TAG STUDY DAYS:');
        const days = await prisma.tagStudyDay.findMany();
        console.log(`   Total: ${days.length}`);

        const dayCodesCheck = new Set();
        const duplicateDays: string[] = [];

        days.forEach(d => {
            const codeDisplay = `${d.code.padEnd(15)} | ${d.name}`;
            console.log(`   - ${codeDisplay}`);

            // Check for issues
            if (dayCodesCheck.has(d.code)) {
                duplicateDays.push(d.code);
            }
            dayCodesCheck.add(d.code);

            // Check for inconsistent naming
            if (d.code !== d.code.toLowerCase()) {
                console.log(`     ❌ Code should be lowercase!`);
            }
        });

        if (days.length !== 7) {
            console.log(`   ⚠️  WARNING: Should have exactly 7 days! Found: ${days.length}`);
        }
        if (duplicateDays.length > 0) {
            console.log(`   ❌ DUPLICATES FOUND: ${duplicateDays.join(', ')}`);
        }

        // Check Tag Study Times
        console.log('\n⏰ TAG STUDY TIMES:');
        const times = await prisma.tagStudyTime.findMany();
        console.log(`   Total: ${times.length}`);

        const timeCodesCheck = new Set();
        const duplicateTimes: string[] = [];

        times.forEach(t => {
            const codeDisplay = `${t.code.padEnd(15)} | ${t.name}`;
            console.log(`   - ${codeDisplay}`);

            // Check for issues
            if (timeCodesCheck.has(t.code)) {
                duplicateTimes.push(t.code);
            }
            timeCodesCheck.add(t.code);

            // Check for inconsistent naming
            if (t.code !== t.code.toLowerCase()) {
                console.log(`     ❌ Code should be lowercase!`);
            }
        });

        if (times.length !== 4) {
            console.log(`   ⚠️  WARNING: Should have exactly 4 time blocks! Found: ${times.length}`);
        }
        if (duplicateTimes.length > 0) {
            console.log(`   ❌ DUPLICATES FOUND: ${duplicateTimes.join(', ')}`);
        }

        // Check Users
        console.log('\n👥 USERS:');
        const userCount = await prisma.user.count();
        console.log(`   Total: ${userCount}`);
        if (userCount === 0) {
            console.log('   ⚠️  No users found. Run seed to create users.');
        }

        // Check Profiles
        console.log('\n📝 PROFILES:');
        const profileCount = await prisma.profile.count();
        console.log(`   Total: ${profileCount}`);
        if (profileCount !== userCount) {
            console.log(`   ⚠️  WARNING: Profile count (${profileCount}) != User count (${userCount})`);
        }

        // Check UserStudySlots
        console.log('\n🗓️  USER STUDY SLOTS:');
        const slotCount = await prisma.userStudySlot.count();
        console.log(`   Total: ${slotCount}`);
        if (userCount > 0) {
            const avgSlots = (slotCount / userCount).toFixed(2);
            console.log(`   Average slots per user: ${avgSlots}`);
            if (parseFloat(avgSlots) < 4) {
                console.log(`   ⚠️  WARNING: Users should have at least 4-12 slots each!`);
            }
        }

        // Check Swipes
        console.log('\n💫 SWIPES:');
        const swipeCount = await prisma.swipe.count();
        console.log(`   Total: ${swipeCount}`);

        // Check Matches
        console.log('\n💕 MATCHES:');
        const matchCount = await prisma.match.count();
        console.log(`   Total: ${matchCount}`);

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 SUMMARY:');
        console.log('='.repeat(80));

        const issues: string[] = [];

        if (subjects.length !== 6) issues.push(`❌ Subjects: ${subjects.length} (expected 6)`);
        if (levels.length !== 3) issues.push(`❌ Levels: ${levels.length} (expected 3)`);
        if (days.length !== 7) issues.push(`❌ Days: ${days.length} (expected 7)`);
        if (times.length !== 4) issues.push(`❌ Times: ${times.length} (expected 4)`);
        if (duplicateDays.length > 0) issues.push(`❌ Duplicate days found`);
        if (duplicateTimes.length > 0) issues.push(`❌ Duplicate times found`);
        if (userCount === 0) issues.push(`⚠️  No users`);
        if (profileCount !== userCount) issues.push(`⚠️  Profile/User mismatch`);

        if (issues.length > 0) {
            console.log('\n🚨 ISSUES FOUND:');
            issues.forEach(issue => console.log(`   ${issue}`));
            console.log('\n💡 RECOMMENDATION: Run cleanup script:');
            console.log('   npx ts-node prisma/cleanup-tags.ts');
        } else {
            console.log('\n✅ DATABASE LOOKS GOOD!');
            if (userCount === 0) {
                console.log('\n💡 Next step: Seed users');
                console.log('   npm run seeds');
            }
        }

        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
