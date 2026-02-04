import mongoose from "mongoose";

const ReactionSchema = new mongoose.Schema(
  {
    userId: String,
    type: String,
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, index: true },
    userId: String,
    content: String,
    images: [String],
    fileUrl: String,

    // 'text' | 'image' | 'file' | 'call' | 'reminder'
    type: { type: String, default: "text" },

    call: {
      status: String, // 'missed', 'rejected', 'ended'
      duration: Number, // seconds
    },

    reminder: {
      reminderId: String,
      content: String,
      scheduledDate: Date,
      creatorName: String,
    },

    replyTo: {
      messageId: String,
      userId: String,
      content: String,
      images: [String],
      fileUrl: String,
    },

    reactions: [ReactionSchema],

    readBy: [String],

    isEdited: Boolean,
    editedAt: Date,

    isRevoked: Boolean,

    isPinned: Boolean,
    pinnedBy: String,
    pinnedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);
