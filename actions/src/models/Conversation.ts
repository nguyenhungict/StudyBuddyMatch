import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  roomId: string;
  members: string[];
  lastMessage?: string;
  updatedAt: Date;
  unread: Map<string, number>;
  clearedAt: Map<string, Date>;  // Track when each user cleared chat
}

const ConversationSchema: Schema<IConversation> = new Schema(
  {
    roomId: { type: String, required: true, unique: true },
    members: [{ type: String, required: true }],
    lastMessage: { type: String },

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

const ConversationModel: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export default ConversationModel;
