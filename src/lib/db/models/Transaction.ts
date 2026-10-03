import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  reference: string;
  paystackId?: string;
  amount: number;
  amountUSD: number;
  channel: string;
  status: "pending" | "success" | "failed";
  boosterApplied: boolean;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reference: { type: String, required: true, unique: true, index: true },
  paystackId: { type: String },
  amount: { type: Number, required: true },
  amountUSD: { type: Number, required: true },
  channel: { type: String, default: "card" },
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  boosterApplied: { type: Boolean, default: false },
}, { timestamps: true });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
