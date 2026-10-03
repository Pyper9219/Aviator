import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBet extends Document {
  roundId: mongoose.Types.ObjectId;
  roundNumber: number;
  userId: mongoose.Types.ObjectId;
  username: string;
  consoleSlot: 1 | 2;
  stakeAmount: number;
  autoCashoutMultiplier?: number;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  payoutAmount: number;
  status: "PENDING" | "ACTIVE" | "CASHED_OUT" | "LOST";
}

const BetSchema = new Schema<IBet>({
  roundId: { type: Schema.Types.ObjectId, ref: "GameRound", required: true, index: true },
  roundNumber: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  username: { type: String, required: true },
  consoleSlot: { type: Number, enum: [1, 2], required: true },
  stakeAmount: { type: Number, required: true, min: 1 },
  autoCashoutMultiplier: { type: Number },
  cashedOut: { type: Boolean, default: false },
  cashedOutMultiplier: { type: Number },
  payoutAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["PENDING", "ACTIVE", "CASHED_OUT", "LOST"], default: "ACTIVE" },
}, { timestamps: true });

export const Bet: Model<IBet> =
  mongoose.models.Bet || mongoose.model<IBet>("Bet", BetSchema);
