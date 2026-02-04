import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing conversations & matches...");

  await prisma.conversation.deleteMany({});
  await prisma.match.deleteMany({});

  console.log("✅ Cleared conversations & matches");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
