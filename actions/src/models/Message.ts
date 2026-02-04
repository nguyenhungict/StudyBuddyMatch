import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  content?: string;
  images?: string[];
  fileUrl?: string;

  // ADD FOR REPLY MESSAGE 
  replyTo?: {
    messageId: string;       
    userId: string;          
    content?: string;         
    images?: string[];        
    fileUrl?: string;         
  };

  userId: string;
  roomId: string;
  createdAt: Date;
  readBy: string[];
  reactions: { userId: string; type: string }[];
  isRevoked?: boolean;

  //  ADD FOR EDIT MESSAGE 
  isEdited?: boolean;
  editedAt?: Date;

    //  ADD FOR PIN MESSAGE 
  isPinned?: boolean;
  pinnedAt?: Date;
  pinnedBy?: string;

}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    content: { type: String },
    images: [{ type: String }],
    fileUrl: { type: String },

    //  ADD FOR REPLY MESSAGE 
    replyTo: {
      messageId: { type: String },
      userId: { type: String },
      content: { type: String },
      images: [{ type: String }],
      fileUrl: { type: String },
      _id: false, // 
    },

    userId: { type: String, required: true },
    roomId: { type: String, required: true },

    readBy: [{ type: String, default: [] }],

    reactions: [
      {
        userId: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],

    isRevoked: { type: Boolean, default: false },

    //  ADD FOR EDIT MESSAGE 
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },

        // ADD FOR PIN MESSAGE 
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date },
    pinnedBy: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const MessageModel: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default MessageModel;
