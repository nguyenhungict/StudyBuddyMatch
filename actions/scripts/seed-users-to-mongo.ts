// scripts/seed-users-to-mongo.ts
import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";
import UserModel from "../src/models/User";

const prisma = new PrismaClient();

async function main() {
  // 1️⃣ Connect Mongo
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("✅ Mongo connected");

  // 2️⃣ Lấy user từ Postgres
  const users = await prisma.user.findMany({
    select: {
      id: true,
      profile: {
        select: {
          username: true,
        },
      },
    },
  });

  let created = 0;

  // 3️⃣ Sync sang Mongo
  for (const u of users) {
    const exists = await UserModel.findOne({
      userId: u.id, // ✅ ĐÚNG FIELD
    });

    if (exists) continue;

    await UserModel.create({
      userId: u.id,
      name: u.profile?.username || "Unknown",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        u.profile?.username || "User"
      )}&background=random`,
    });

    created++;
  }

  console.log(`🎉 Synced ${created} users to Mongo`);
  process.exit(0);
}

main().catch(console.error);
