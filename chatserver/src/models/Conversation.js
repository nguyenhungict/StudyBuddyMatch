import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    roomId: { type: String, unique: true },
    members: [String],

    lastMessage: String,

    unread: {
      type: Map,
      of: Number,
      default: {},
    },

    clearedAt: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", ConversationSchema);
