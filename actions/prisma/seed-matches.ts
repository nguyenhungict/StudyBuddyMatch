import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * (A,B) === (B,A)
 */
function normalizePair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

const MAX_MATCH_PER_USER = 4;

async function main() {
  console.log("🌱 Seeding matches + conversations (LIMITED SAFE)...");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });

  if (users.length < 2) {
    throw new Error("❌ Not enough users");
  }

  console.log(`👥 Total users: ${users.length}`);
  console.log(`🎯 Max matches per user: ${MAX_MATCH_PER_USER}`);

  // 👉 Track số match của mỗi user
  const matchCount = new Map<string, number>();
  users.forEach(u => matchCount.set(u.id, 0));

  let createdMatches = 0;
  let createdConversations = 0;

  for (let i = 0; i < users.length; i++) {
    const userA = users[i];

    // nếu userA đã đủ match → skip
    if ((matchCount.get(userA.id) || 0) >= MAX_MATCH_PER_USER) continue;

    for (let j = i + 1; j < users.length; j++) {
      const userB = users[j];

      if ((matchCount.get(userA.id) || 0) >= MAX_MATCH_PER_USER) break;
      if ((matchCount.get(userB.id) || 0) >= MAX_MATCH_PER_USER) continue;

      const [u1, u2] = normalizePair(userA.id, userB.id);

      const existedMatch = await prisma.match.findFirst({
        where: { user1Id: u1, user2Id: u2 },
        include: { conversations: true },
      });

      if (existedMatch) {
        // match có rồi nhưng thiếu conversation
        if (!existedMatch.conversations || existedMatch.conversations.length === 0) {
          await prisma.conversation.create({
            data: {
              matchId: existedMatch.id,
              status: "OPEN",
            },
          });
          createdConversations++;
          console.log(`🧩 Added conversation: ${userA.email} ↔ ${userB.email}`);
        }
        continue;
      }

      // tạo match
      const match = await prisma.match.create({
        data: {
          user1Id: u1,
          user2Id: u2,
          status: "ACTIVE",
        },
      });

      // tạo conversation
      await prisma.conversation.create({
        data: {
          matchId: match.id,
          status: "OPEN",
        },
      });

      // update counter
      matchCount.set(userA.id, (matchCount.get(userA.id) || 0) + 1);
      matchCount.set(userB.id, (matchCount.get(userB.id) || 0) + 1);

      createdMatches++;
      createdConversations++;

      console.log(`✅ Match: ${userA.email} ↔ ${userB.email}`);
    }
  }

  console.log("🎉 SEED DONE");
  console.log(`➕ Matches created: ${createdMatches}`);
  console.log(`➕ Conversations created: ${createdConversations}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
