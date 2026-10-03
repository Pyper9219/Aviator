import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGameRound extends Document {
  roundNumber: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  sha256Hash: string;
  crashMultiplier: number;
  status: "PREPARING" | "IN_FLIGHT" | "CRASHED";
  startedAt: Date;
  crashedAt?: Date;
}

const GameRoundSchema = new Schema<IGameRound>({
  roundNumber: { type: Number, required: true, unique: true, index: true },
  serverSeed: { type: String, required: true },
  clientSeed: { type: String, required: true },
  nonce: { type: Number, required: true },
  sha256Hash: { type: String, required: true },
  crashMultiplier: { type: Number, required: true },
  status: { type: String, enum: ["PREPARING", "IN_FLIGHT", "CRASHED"], default: "PREPARING" },
  startedAt: { type: Date, default: Date.now },
  crashedAt: { type: Date },
}, { timestamps: true });

export const GameRound: Model<IGameRound> =
  mongoose.models.GameRound || mongoose.model<IGameRound>("GameRound", GameRoundSchema);
