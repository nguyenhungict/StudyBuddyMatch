import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import MessageModel from "./models/Message.js";
import ConversationModel from "./models/Conversation.js";
import ReminderModel from "./models/Reminder.js";
import { violationFilter } from "./violationFilter.js";


dotenv.config({ path: path.join(process.cwd(), ".env") });

const server = http.createServer();

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// userId 
const onlineUsers = new Map();

// socketId 
const socketUserMap = new Map();

// socketId 
const userActiveRoom = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // REGISTER USER
  socket.on("registerUser", (userId) => {
    if (!userId) return;

    socketUserMap.set(socket.id, userId);

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    socket.join(userId);

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // JOIN ROOM
  socket.on("joinRoom", async (roomId) => {
    socket.join(roomId);
    console.log(`🟢 ${socket.id} joined room: ${roomId}`);

    userActiveRoom.set(socket.id, roomId);

    // Get current user ID
    const userId = socketUserMap.get(socket.id);
    console.log(`🔍 User ID: ${userId}`);

    // Check if user has cleared chat
    let clearedAt = null;
    if (userId) {
      const conversation = await ConversationModel.findOne({ roomId });
      clearedAt = conversation?.clearedAt?.get(userId);
      console.log(`🗑️ ClearedAt for user ${userId}:`, clearedAt);
    }

    // Build query with clearedAt filter
    const matchQuery = { roomId };
    if (clearedAt) {
      matchQuery.createdAt = { $gt: clearedAt };
      console.log(`📋 Filtering messages after:`, clearedAt);
    }

    const messages = await MessageModel.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      { $sort: { createdAt: 1 } },
    ]);

    console.log(`📨 Loaded ${messages.length} messages for room ${roomId}`);
    socket.emit("loadMessages", messages);
  });

  // LEAVE ROOM
  socket.on("leaveRoom", () => {
    const roomId = userActiveRoom.get(socket.id);
    if (roomId) {
      console.log(`🚪 ${socket.id} left room: ${roomId}`);
      socket.leave(roomId);
      userActiveRoom.delete(socket.id);
    }
  });

  // USER UPDATE
  socket.on("userUpdated", (userData) => {
    io.emit("chatUserUpdated", userData);
  });

  // SEND MESSAGE
  socket.on("sendMessage", async (msg) => {
    try {
      // Ensure keywords are loaded
      await violationFilter.ensureKeywords();

      console.log('📨 Received message:', msg.content);

      // Filter violation keywords
      const filteredContent = msg.content ? violationFilter.filterContent(msg.content) : msg.content;

      const payload = {
        ...msg,
        content: filteredContent,
        replyTo: msg.replyTo ?? null,
        createdAt: new Date(),
        readBy: [msg.userId],
      };

      const saved = await MessageModel.create(payload);
      const convoBefore = await ConversationModel.findOne({
        roomId: saved.roomId,
      });

      if (!convoBefore) {
        console.error("❌ Conversation not found:", saved.roomId);
        return;
      }

      const members = convoBefore.members;

      const unreadUpdate = {};
      members.forEach((m) => {
        if (m === msg.userId) {
          unreadUpdate[`unread.${m}`] = 0;
        } else {
          const oldValue = convoBefore?.unread?.get(m) || 0;
          unreadUpdate[`unread.${m}`] = oldValue + 1;
        }
      });

      // auto-read if user active room
      const readers = [];
      for (const user of members) {
        if (user === msg.userId) continue;

        const sockets = onlineUsers.get(user);
        if (!sockets) continue;

        for (const sid of sockets) {
          if (userActiveRoom.get(sid) === saved.roomId) {
            readers.push(user);
          }
        }
      }

      if (readers.length > 0) {
        await MessageModel.updateMany(
          { roomId: saved.roomId },
          { $addToSet: { readBy: { $each: readers } } }
        );

        readers.forEach((u) => {
          unreadUpdate[`unread.${u}`] = 0;
        });
      }

      let conversation = await ConversationModel.findOneAndUpdate(
        { roomId: saved.roomId },
        {
          $set: {
            lastMessage: saved.content || "File",
            updatedAt: new Date(),
            lastSenderId: msg.userId,
          },
          ...unreadUpdate,
        },
        { new: true }
      );

      // SAFETY NET 
      if (!conversation) {
        conversation = await ConversationModel.findOne({ roomId: saved.roomId });
        if (!conversation) {
          console.error("❌ Conversation lost after sendMessage:", saved.roomId);
          return;
        }
      }


      // update sidebar member
      members.forEach((m) => {
        io.to(m).emit("conversationUpdated", {
          ...conversation.toObject(),
          unreadCount: conversation.unread?.get(m) || 0,
        });
      });

      io.to(saved.roomId).emit("receiveMessage", saved);

      // emit read event cho người đang mở room
      readers.forEach((u) => {
        io.to(saved.roomId).emit("messagesRead", {
          roomId: saved.roomId,
          userId: u,
        });
      });
    } catch (e) {
      console.error("sendMessage error:", e);
    }
  });

  // REACTION
  socket.on("sendReaction", async ({ messageId, userId, type }) => {
    try {
      const msg = await MessageModel.findById(messageId);
      if (!msg) return;

      const existing = msg.reactions.find((r) => r.userId === userId);

      if (existing) {
        if (existing.type === type) {
          msg.reactions = msg.reactions.filter((r) => r.userId !== userId);
        } else {
          existing.type = type;
        }
      } else {
        msg.reactions.push({ userId, type });
      }

      await msg.save();

      io.to(msg.roomId).emit("reactionUpdated", msg.toObject());
    } catch (e) {
      console.error("sendReaction error:", e);
    }
  });

  // REVOKE MESSAGE 
  socket.on("revokeMessage", async ({ messageId }) => {
    try {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      const msg = await MessageModel.findById(messageId);
      if (!msg) return;

      if (msg.userId !== userId) return;

      msg.isRevoked = true;
      msg.content = null;
      msg.images = [];
      msg.fileUrl = null;
      await msg.save();

      io.to(msg.roomId).emit("messageRevoked", {
        messageId: msg._id.toString(),
      });

      const latestMessage = await MessageModel.findOne({ roomId: msg.roomId })
        .sort({ createdAt: -1 })
        .lean();

      if (latestMessage && latestMessage._id.toString() === msg._id.toString()) {
        const convo = await ConversationModel.findOneAndUpdate(
          { roomId: msg.roomId },
          { lastMessage: "Tin nhắn đã bị thu hồi", updatedAt: new Date() },
          { new: true }
        );

        if (convo) {
          convo.members.forEach((m) => {
            io.to(m).emit("conversationUpdated", {
              ...convo.toObject(),
              unreadCount: convo.unread?.get(m) || 0,
            });
          });
        }
      }
    } catch (e) {
      console.error("revokeMessage error:", e);
    }
  });

  // EDIT MESSAGE
  socket.on("editMessage", async ({ messageId, content }) => {
    try {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      const msg = await MessageModel.findById(messageId);
      if (!msg) return;

      if (msg.userId !== userId) return;
      if (msg.isRevoked) return;

      msg.content = content;
      // Filter violation keywords
      await violationFilter.ensureKeywords();
      const filteredContent = violationFilter.filterContent(content);

      msg.content = filteredContent;
      msg.isEdited = true;
      msg.editedAt = new Date();
      await msg.save();

      io.to(msg.roomId).emit("messageEdited", {
        _id: msg._id.toString(),
        content: msg.content,
        isEdited: true,
      });

      const latestMessage = await MessageModel.findOne({ roomId: msg.roomId })
        .sort({ createdAt: -1 })
        .lean();

      if (latestMessage && latestMessage._id.toString() === msg._id.toString()) {
        const convo = await ConversationModel.findOneAndUpdate(
          { roomId: msg.roomId },
          { lastMessage: `${content} (đã chỉnh sửa)`, updatedAt: new Date() },
          { new: true }
        );

        if (convo) {
          convo.members.forEach((m) => {
            io.to(m).emit("conversationUpdated", {
              ...convo.toObject(),
              unreadCount: convo.unread?.get(m) || 0,
            });
          });
        }
      }
    } catch (e) {
      console.error("editMessage error:", e);
    }
  });

  // PIN MESSAGE
  socket.on("pinMessage", async ({ messageId }) => {
    try {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      const msg = await MessageModel.findById(messageId);
      if (!msg) return;

      const roomId = msg.roomId;

      await MessageModel.updateMany(
        { roomId, isPinned: true },
        { $set: { isPinned: false, pinnedBy: null, pinnedAt: null } }
      );

      msg.isPinned = true;
      msg.pinnedBy = userId;
      msg.pinnedAt = new Date();
      await msg.save();

      io.to(roomId).emit("messagePinned", {
        messageId: msg._id.toString(),
        pinnedBy: userId,
        pinnedAt: msg.pinnedAt,
      });
    } catch (e) {
      console.error("pinMessage error:", e);
    }
  });

  // UNPIN MESSAGE
  socket.on("unpinMessage", async ({ messageId }) => {
    try {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      const msg = await MessageModel.findById(messageId);
      if (!msg || !msg.isPinned) return;

      const roomId = msg.roomId;

      msg.isPinned = false;
      msg.pinnedBy = null;
      msg.pinnedAt = null;
      await msg.save();

      io.to(roomId).emit("messageUnpinned", {
        messageId: msg._id.toString(),
      });
    } catch (e) {
      console.error("unpinMessage error:", e);
    }
  });

  // TYPING
  socket.on("typing", ({ roomId }) => {
    const userId = socketUserMap.get(socket.id);
    if (!userId) return;

    io.to(roomId).emit("typing", { roomId, userId });
  });

  socket.on("stopTyping", ({ roomId }) => {
    const userId = socketUserMap.get(socket.id);
    if (!userId) return;

    io.to(roomId).emit("stopTyping", { roomId, userId });
  });

  // MARK AS READ
  socket.on("markAsRead", async ({ roomId, userId }) => {
    try {
      await MessageModel.updateMany(
        { roomId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );

      const updated = await ConversationModel.findOneAndUpdate(
        { roomId },
        { $set: { [`unread.${userId}`]: 0 } },
        { new: true, timestamps: false }
      );

      if (updated) {
        io.to(userId).emit("conversationUpdated", {
          ...updated.toObject(),
          unreadCount: 0,
        });
      }

      io.to(roomId).emit("messagesRead", { roomId, userId });
    } catch (e) {
      console.error("markAsRead error:", e);
    }
  });


  // START VIDEO CALL
  socket.on("startVideoCall", ({ roomId, from, to, callId, videoRoomId }) => {
    console.log(`📹 Video call request: ${from} → ${to}, callId: ${callId || 'N/A'}`);

    io.to(to).emit("incomingVideoCall", {
      from: from,
      roomId: roomId,
      videoRoomId: videoRoomId || `video-${Date.now()}`,
      callId: callId,
    });
  });

  // ACCEPT VIDEO CALL
  socket.on("acceptVideoCall", ({ videoRoomId, to, roomId }) => {
    console.log(`✅ Video call accepted, redirecting to room: ${videoRoomId}`);

    io.to(to).emit("videoCallAccepted", { videoRoomId, roomId });
  });

  // REJECT VIDEO CALL
  socket.on("rejectVideoCall", async ({ to, roomId }) => {
    console.log(`❌ Video call rejected by ${socket.id}, room: ${roomId}`);
    io.to(to).emit("videoCallRejected");
    if (roomId) {
      try {
        const callerId = to;
        const rejecterId = socketUserMap.get(socket.id);

        // Get conversation to find other member
        const conversation = await ConversationModel.findOne({ roomId });
        const otherUserId = conversation?.members.find(m => m !== callerId);

        // Check if other user is currently in this room
        let otherUserInRoom = false;
        if (otherUserId) {
          const otherSockets = onlineUsers.get(otherUserId);
          if (otherSockets) {
            for (const socketId of otherSockets) {
              if (userActiveRoom.get(socketId) === roomId) {
                otherUserInRoom = true;
                break;
              }
            }
          }
        }

        // If other user is in room, mark as read by both
        const readByList = otherUserInRoom && otherUserId
          ? [callerId, otherUserId]
          : [callerId];

        const payload = {
          roomId,
          userId: callerId,
          content: "Call Rejected",
          type: "call",
          call: { status: "rejected", duration: 0 },
          createdAt: new Date(),
          readBy: readByList,
        };

        const saved = await MessageModel.create(payload);

        // Update unread count if other user is not in room
        if (!otherUserInRoom && otherUserId && conversation) {
          const currentUnread = conversation.unread?.get(otherUserId) || 0;
          if (!conversation.unread) {
            conversation.unread = new Map();
          }
          conversation.unread.set(otherUserId, currentUnread + 1);
          await conversation.save();
        }

        // Update Conversation
        const updatedConversation = await ConversationModel.findOneAndUpdate(
          { roomId },
          {
            lastMessage: "📞 Call Rejected",
            updatedAt: new Date(),
            lastSenderId: callerId,
          },
          { new: true }
        );

        if (updatedConversation) {
          updatedConversation.members.forEach((m) => {
            io.to(m).emit("conversationUpdated", {
              ...updatedConversation.toObject(),
              unreadCount: updatedConversation.unread?.get(m) || 0,
            });
          });
        }

        io.to(roomId).emit("receiveMessage", saved);
      } catch (e) {
        console.error("Error saving rejected call message:", e);
      }
    }
  });

  // END VIDEO CALL
  socket.on("endVideoCall", async ({ to, roomId, duration, callerId }) => {
    console.log(`📞 Video call ended. roomId: ${roomId}, to: ${to}`);

    try {
      if (roomId) {
        const conversation = await ConversationModel.findOne({ roomId });
        if (conversation && conversation.members) {
          conversation.members.forEach((memberId) => {
            io.to(memberId).emit("call-ended");
          });
        } else {
          io.to(to).emit("call-ended");
        }
      } else {
        io.to(to).emit("call-ended");
      }
    } catch (err) {
      console.error("Error broadcasting call-ended:", err);
      io.to(to).emit("call-ended");
    }

    if (roomId) {
      try {
        const currentUser = socketUserMap.get(socket.id);
        const senderId = callerId || currentUser;

        if (!senderId) return;

        // Get conversation to find other member
        const conversation = await ConversationModel.findOne({ roomId });
        const otherUserId = conversation?.members.find(m => m !== senderId);

        // Check if other user is currently in this room
        let otherUserInRoom = false;
        if (otherUserId) {
          const otherSockets = onlineUsers.get(otherUserId);
          if (otherSockets) {
            for (const socketId of otherSockets) {
              if (userActiveRoom.get(socketId) === roomId) {
                otherUserInRoom = true;
                break;
              }
            }
          }
        }

        // If other user is in room, mark as read by both
        const readByList = otherUserInRoom && otherUserId
          ? [senderId, otherUserId]
          : [senderId];

        const payload = {
          roomId,
          userId: senderId,
          content: "Video Call",
          type: "call",
          call: { status: "ended", duration: duration || 0 },
          createdAt: new Date(),
          readBy: readByList,
        };

        const saved = await MessageModel.create(payload);

        // Update unread count if other user is not in room
        if (!otherUserInRoom && otherUserId && conversation) {
          const currentUnread = conversation.unread?.get(otherUserId) || 0;
          if (!conversation.unread) {
            conversation.unread = new Map();
          }
          conversation.unread.set(otherUserId, currentUnread + 1);
          await conversation.save();
        }

        // Update Conversation
        const updatedConversation = await ConversationModel.findOneAndUpdate(
          { roomId },
          {
            lastMessage: "📞 Video Call",
            updatedAt: new Date(),
            lastSenderId: senderId,
          },
          { new: true }
        );

        if (updatedConversation) {
          updatedConversation.members.forEach((m) => {
            io.to(m).emit("conversationUpdated", {
              ...updatedConversation.toObject(),
              unreadCount: updatedConversation.unread?.get(m) || 0,
            });
          });
        }

        io.to(roomId).emit("receiveMessage", saved);
      } catch (e) {
        console.error("Error saving ended call message:", e);
      }
    }
  });

  // MISSED VIDEO CALL
  socket.on("missedVideoCall", async ({ to, roomId, callerId }) => {
    console.log(`⚠️ Video call missed/cancelled, roomId: ${roomId}, callerId: ${callerId}`);
    console.log(`📤 Emitting videoCallMissed to userId: ${to}`);

    // Notify callee (B) to close popup
    io.to(to).emit("videoCallMissed");
    console.log(`✅ videoCallMissed event emitted`);

    if (roomId) {
      try {
        const senderId = callerId || socketUserMap.get(socket.id);
        if (!senderId) return;

        // Get conversation to find other member
        const conversation = await ConversationModel.findOne({ roomId });
        const otherUserId = conversation?.members.find(m => m !== senderId);

        // Check if other user is currently in this room
        let otherUserInRoom = false;
        if (otherUserId) {
          const otherSockets = onlineUsers.get(otherUserId);
          if (otherSockets) {
            for (const socketId of otherSockets) {
              if (userActiveRoom.get(socketId) === roomId) {
                otherUserInRoom = true;
                break;
              }
            }
          }
        }

        // If other user is in room, mark as read by both
        const readByList = otherUserInRoom && otherUserId
          ? [senderId, otherUserId]
          : [senderId];

        const payload = {
          roomId,
          userId: senderId,
          content: "Missed Call",
          type: "call",
          call: { status: "missed", duration: 0 },
          createdAt: new Date(),
          readBy: readByList,
        };

        const saved = await MessageModel.create(payload);

        // Update unread count if other user is not in room
        if (!otherUserInRoom && otherUserId && conversation) {
          const currentUnread = conversation.unread?.get(otherUserId) || 0;
          if (!conversation.unread) {
            conversation.unread = new Map();
          }
          conversation.unread.set(otherUserId, currentUnread + 1);
          await conversation.save();
        }

        const updatedConversation = await ConversationModel.findOneAndUpdate(
          { roomId },
          {
            lastMessage: "📞 Missed Call",
            updatedAt: new Date(),
            lastSenderId: senderId,
          },
          { new: true }
        );

        if (updatedConversation) {
          updatedConversation.members.forEach((m) => {
            io.to(m).emit("conversationUpdated", {
              ...updatedConversation.toObject(),
              unreadCount: updatedConversation.unread?.get(m) || 0,
            });
          });
        }

        // ✅ BROADCAST to BOTH users so they can see in chat history
        io.to(roomId).emit("receiveMessage", saved);
      } catch (e) {
        console.error("Error saving missed call message:", e);
      }
    }
  });

  // USER UPDATE AVATAR
  socket.on("userAvatarUpdated", ({ userId, avatar }) => {
    if (!userId || !avatar) return;

    // broadcast user online
    io.emit("userAvatarUpdated", {
      userId,
      avatar,
      updatedAt: new Date(),
    });
  });



  // CREATE REMINDER
  socket.on("createReminder", async ({ roomId, content, scheduledDate, creatorId, creatorName }) => {
    try {
      console.log(`📅 Creating reminder: ${content} for ${scheduledDate}`);

      // 1. Create reminder record
      const reminder = await ReminderModel.create({
        roomId,
        creatorId,
        creatorName,
        content,
        scheduledDate: new Date(scheduledDate),
      });

      // Get conversation to find other member
      const conversation = await ConversationModel.findOne({ roomId });
      const otherUserId = conversation?.members.find(m => m !== creatorId);

      // Check if other user is currently in this room
      let otherUserInRoom = false;
      if (otherUserId) {
        const otherSockets = onlineUsers.get(otherUserId);
        if (otherSockets) {
          for (const socketId of otherSockets) {
            if (userActiveRoom.get(socketId) === roomId) {
              otherUserInRoom = true;
              break;
            }
          }
        }
      }

      // 2. Create a "reminder" message in chat
      // If other user is in room, mark as read by both
      const readByList = otherUserInRoom && otherUserId
        ? [creatorId, otherUserId]
        : [creatorId];

      const payload = {
        roomId,
        userId: creatorId,
        content: content,
        type: "reminder",
        reminder: {
          reminderId: reminder._id.toString(),
          content: content,
          scheduledDate: new Date(scheduledDate),
          creatorName: creatorName,
        },
        createdAt: new Date(),
        readBy: readByList,
      };

      const saved = await MessageModel.create(payload);

      // Update reminder with messageId
      reminder.messageId = saved._id.toString();
      await reminder.save();

      // 3. Update conversation with unread count
      // If other user is NOT in room, increment their unread count
      const updateData = {
        lastMessage: `📅 Reminder: ${content}`,
        updatedAt: new Date(),
        lastSenderId: creatorId,
      };

      if (!otherUserInRoom && otherUserId && conversation) {
        // Increment unread for other user
        const currentUnread = conversation.unread?.get(otherUserId) || 0;
        if (!conversation.unread) {
          conversation.unread = new Map();
        }
        conversation.unread.set(otherUserId, currentUnread + 1);
        await conversation.save();
      }

      const updatedConversation = await ConversationModel.findOneAndUpdate(
        { roomId },
        updateData,
        { new: true }
      );

      if (updatedConversation) {
        updatedConversation.members.forEach((m) => {
          io.to(m).emit("conversationUpdated", {
            ...updatedConversation.toObject(),
            unreadCount: updatedConversation.unread?.get(m) || 0,
          });
        });
      }

      // 4. Broadcast to room
      io.to(roomId).emit("receiveMessage", saved);
      io.to(roomId).emit("reminderCreated", {
        reminder: reminder.toObject(),
        message: saved.toObject(),
      });

      console.log(`✅ Reminder created: ${reminder._id}`);
    } catch (e) {
      console.error("createReminder error:", e);
      socket.emit("reminderError", { error: e.message });
    }
  });

  // UPDATE REMINDER
  socket.on("updateReminder", async ({ reminderId, content, scheduledDate }) => {
    try {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      const reminder = await ReminderModel.findById(reminderId);
      if (!reminder) {
        socket.emit("reminderError", { error: "Reminder not found" });
        return;
      }

      // Only creator can edit
      if (reminder.creatorId !== userId) {
        socket.emit("reminderError", { error: "Not authorized" });
        return;
      }

      // Update reminder
      if (content) reminder.content = content;
      if (scheduledDate) {
        reminder.scheduledDate = new Date(scheduledDate);
        // Reset notification status so it will notify on new date, not old date
        reminder.notificationSent = false;
      }
      await reminder.save();

      // Update the message in chat
      if (reminder.messageId) {
        await MessageModel.findByIdAndUpdate(reminder.messageId, {
          content: content || reminder.content,
          "reminder.content": content || reminder.content,
          "reminder.scheduledDate": scheduledDate ? new Date(scheduledDate) : reminder.scheduledDate,
          isEdited: true,
          editedAt: new Date(),
        });
      }

      // Get conversation to find other member
      const conversation = await ConversationModel.findOne({ roomId: reminder.roomId });
      const otherUserId = conversation?.members.find(m => m !== userId);

      // Check if other user is currently in this room
      let otherUserInRoom = false;
      if (otherUserId) {
        const otherSockets = onlineUsers.get(otherUserId);
        if (otherSockets) {
          for (const socketId of otherSockets) {
            if (userActiveRoom.get(socketId) === reminder.roomId) {
              otherUserInRoom = true;
              break;
            }
          }
        }
      }

      // Update unread count if other user is not in room
      if (!otherUserInRoom && otherUserId && conversation) {
        const currentUnread = conversation.unread?.get(otherUserId) || 0;
        if (!conversation.unread) {
          conversation.unread = new Map();
        }
        conversation.unread.set(otherUserId, currentUnread + 1);
        await conversation.save();
      }

      // Update conversation lastMessage to show "Rescheduled: ..."
      const updatedConversation = await ConversationModel.findOneAndUpdate(
        { roomId: reminder.roomId },
        {
          lastMessage: `📅 Rescheduled: ${reminder.content}`,
          updatedAt: new Date(),
          lastSenderId: userId,
        },
        { new: true }
      );

      // Broadcast to both members
      if (updatedConversation) {
        updatedConversation.members.forEach((m) => {
          io.to(m).emit("conversationUpdated", {
            ...updatedConversation.toObject(),
            unreadCount: updatedConversation.unread?.get(m) || 0,
          });
        });
      }

      io.to(reminder.roomId).emit("reminderUpdated", {
        reminder: reminder.toObject(),
      });

      console.log(`✅ Reminder updated: ${reminderId}`);
    } catch (e) {
      console.error("updateReminder error:", e);
      socket.emit("reminderError", { error: e.message });
    }
  });

  // GET REMINDER BY ID
  socket.on("getReminder", async ({ reminderId }) => {
    try {
      const reminder = await ReminderModel.findById(reminderId);
      if (!reminder) {
        socket.emit("reminderError", { error: "Reminder not found" });
        return;
      }

      socket.emit("reminderData", { reminder: reminder.toObject() });
    } catch (e) {
      console.error("getReminder error:", e);
      socket.emit("reminderError", { error: e.message });
    }
  });

  // DELETE/CANCEL REMINDER
  socket.on("cancelReminder", async ({ reminderId }) => {
    try {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      const reminder = await ReminderModel.findById(reminderId);
      if (!reminder) {
        socket.emit("reminderError", { error: "Reminder not found" });
        return;
      }

      if (reminder.creatorId !== userId) {
        socket.emit("reminderError", { error: "Not authorized" });
        return;
      }

      // Mark reminder as cancelled
      reminder.isCancelled = true;
      reminder.notificationSent = true; // Prevent future notifications
      await reminder.save();

      // Update the original reminder message to show cancelled state
      if (reminder.messageId) {
        await MessageModel.findByIdAndUpdate(reminder.messageId, {
          type: "reminder_cancelled",
          isEdited: true,
          editedAt: new Date(),
        });
      }

      // Get conversation to find other member
      const conversation = await ConversationModel.findOne({ roomId: reminder.roomId });
      const otherUserId = conversation?.members.find(m => m !== userId);

      // Check if other user is currently in this room
      let otherUserInRoom = false;
      if (otherUserId) {
        const otherSockets = onlineUsers.get(otherUserId);
        if (otherSockets) {
          for (const socketId of otherSockets) {
            if (userActiveRoom.get(socketId) === reminder.roomId) {
              otherUserInRoom = true;
              break;
            }
          }
        }
      }

      // Update unread count if other user is not in room
      if (!otherUserInRoom && otherUserId && conversation) {
        const currentUnread = conversation.unread?.get(otherUserId) || 0;
        if (!conversation.unread) {
          conversation.unread = new Map();
        }
        conversation.unread.set(otherUserId, currentUnread + 1);
        await conversation.save();
      }

      // Update conversation
      const updatedConversation = await ConversationModel.findOneAndUpdate(
        { roomId: reminder.roomId },
        {
          lastMessage: `🚫 Cancelled reminder: ${reminder.content}`,
          updatedAt: new Date(),
          lastSenderId: userId,
        },
        { new: true }
      );

      // Broadcast to both members
      if (updatedConversation) {
        updatedConversation.members.forEach((m) => {
          io.to(m).emit("conversationUpdated", {
            ...updatedConversation.toObject(),
            unreadCount: updatedConversation.unread?.get(m) || 0,
          });
        });
      }

      // Emit reminder cancelled event to update UI
      io.to(reminder.roomId).emit("reminderCancelled", {
        reminderId,
        content: reminder.content,
      });

      console.log(`🚫 Reminder cancelled: ${reminderId}`);
    } catch (e) {
      console.error("cancelReminder error:", e);
      socket.emit("reminderError", { error: e.message });
    }
  });


  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);

    const userId = socketUserMap.get(socket.id);
    socketUserMap.delete(socket.id);
    userActiveRoom.delete(socket.id);

    if (userId && onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});

// START CHATSERVER
server.listen(process.env.CHATSERVER_PORT || 4000, () => {
  console.log(`🚀 Chatserver running on ${process.env.CHATSERVER_PORT || 4000}`);
});

// MONGODB
(async () => {
  try {
    console.log("🔧 Connecting MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ MongoDB connected");

    // 📅 REMINDER NOTIFICATION CHECKER (runs every minute)
    setInterval(async () => {
      try {
        const now = new Date();

        // Find reminders that are due (scheduledDate <= now) and not yet notified
        const dueReminders = await ReminderModel.find({
          scheduledDate: { $lte: now },
          notificationSent: false,
          isCancelled: false,
        });

        for (const reminder of dueReminders) {
          console.log(`📅 Sending reminder notification: ${reminder.content}`);

          // Get conversation to find both members
          const conversation = await ConversationModel.findOne({ roomId: reminder.roomId });

          if (conversation) {
            // Send notification to BOTH members via API
            const ACTIONS_URL = process.env.ACTIONS_URL || "http://localhost:3001";

            for (const memberId of conversation.members) {
              try {
                const response = await fetch(`${ACTIONS_URL}/notifications`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userId: memberId,
                    type: "REMINDER",
                    content: `⏰ Today you have a reminder: ${reminder.content}`,
                  }),
                });

                if (response.ok) {
                  console.log(`✅ Notification sent to ${memberId}`);

                  // Emit socket event to update notification count in real-time
                  io.to(memberId).emit("newNotification", {
                    type: "REMINDER",
                    content: `⏰ Today you have a reminder: ${reminder.content}`,
                  });
                } else {
                  console.error(`❌ Failed to send notification to ${memberId}`);
                }
              } catch (fetchErr) {
                console.error(`❌ Error sending notification to ${memberId}:`, fetchErr);
              }
            }
          }

          // Mark reminder as notified
          reminder.notificationSent = true;
          await reminder.save();

          console.log(`✅ Reminder notification sent: ${reminder._id}`);
        }
      } catch (e) {
        console.error("❌ Reminder checker error:", e);
      }
    }, 60000); // Check every minute

    // Load violation keywords
    await violationFilter.loadKeywords();
  } catch (e) {
    console.error("❌ MongoDB error:", e);
  }
})();
