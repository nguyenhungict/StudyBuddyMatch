import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  userId: string;
  name: string;
  avatar: string;
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: { type: String, required: true },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
