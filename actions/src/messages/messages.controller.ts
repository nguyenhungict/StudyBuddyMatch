import { Controller, Get, Param, Query } from "@nestjs/common";
import MessageModel from "../models/Message";

@Controller("messages")
export class MessagesController {
  //  search
  @Get("search")
  async searchMessages(
    @Query("roomId") roomId: string,
    @Query("keyword") keyword: string,
  ) {
    if (!roomId || !keyword) return [];

    // Call patterns to exclude from search (both Vietnamese and English)
    const callPatterns = [
      "Cuộc gọi thoại",
      "Cuộc gọi nhỡ",
      "Cuộc gọi bị từ chối",
      "Video Call",
      "Missed Call",
      "Call Rejected"
    ];

    return MessageModel.find({
      roomId,
      isRevoked: { $ne: true },
      content: {
        $regex: keyword,
        $options: "i",
        $nin: callPatterns
      },
      $nor: callPatterns.map(pattern => ({ content: pattern }))
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
  }

  // LẤY MESSAGE THEO ID
  @Get(":id")
  async getMessageById(@Param("id") id: string) {
    if (!id) return null;

    return MessageModel.findOne({
      _id: id,
      isRevoked: { $ne: true },
    }).lean();
  }
}
