import ConversationModel from "../models/Conversation.js";

// GET /api/conversations?userId=xxx
export const getConversations = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  try {
    // Lấy tất cả conversation mà user là thành viên, sort theo updatedAt mới nhất
    const conversations = await ConversationModel.find({ members: userId })
      .sort({ updatedAt: -1 })
      .lean();
    // Trả về unreadCount cho từng conversation nếu có
    const mapped = conversations.map((c) => ({
      ...c,
      unreadCount: c.unread?.[userId] || 0,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("[Conversations API]", err);
    res.status(500).json({ error: "Server error", detail: err?.message });
  }
};
