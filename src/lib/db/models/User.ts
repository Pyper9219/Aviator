import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  balanceUSD: number;
  bonusBalanceUSD: number;
  vipLevel: number;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  balanceUSD: { type: Number, required: true, default: 0, min: 0 },
  bonusBalanceUSD: { type: Number, default: 0, min: 0 },
  vipLevel: { type: Number, default: 1 },
}, { timestamps: true });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
