// scripts/seed-chat.ts
import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";
import ConversationModel from "../src/models/Conversation";
import UserModel from "../src/models/User";

const prisma = new PrismaClient();

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log("✅ Mongo connected");


  const matches = await prisma.match.findMany({
    where: { status: "ACTIVE" },
  });

  console.log("Found matches:", matches.length);

  for (const match of matches) {
    // đảm bảo user tồn tại trong Mongo
    const user1 = await UserModel.findOne({ userId: match.user1Id });
    const user2 = await UserModel.findOne({ userId: match.user2Id });

    if (!user1 || !user2) {
      console.warn("⚠️ Skip match (missing mongo user):", match.id);
      continue;
    }

    const roomId = `match_${match.id}`;

    await ConversationModel.create({
      roomId,
      members: [
        match.user1Id, 
        match.user2Id,
      ],
      unread: {},
    });

    console.log("✅ Created conversation:", roomId);
  }

  console.log("🎉 Seed chat DONE");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
