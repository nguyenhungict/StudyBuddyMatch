import { Controller, Get, Post, Query, Body } from "@nestjs/common";
import { ConversationsService } from "./conversations.service";

@Controller("conversations")
export class ConversationsController {
  constructor(private readonly service: ConversationsService) { }

  @Get()
  async getByUser(@Query("userId") userId: string) {
    if (!userId) {
      return { error: "Missing userId" };
    }
    return this.service.getByUser(userId);
  }

  @Post("clear")
  async clearChat(
    @Body("roomId") roomId: string,
    @Body("userId") userId: string
  ) {
    if (!roomId || !userId) {
      return { error: "Missing roomId or userId" };
    }
    return this.service.clearChat(roomId, userId);
  }
}
