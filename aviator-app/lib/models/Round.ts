import { ObjectId } from 'mongodb';

export interface Round {
  _id?: ObjectId;
  roundNumber: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  crashPoint: number;
  status: 'pending' | 'active' | 'crashed' | 'completed';
  startedAt: Date;
  crashedAt?: Date;
  createdAt: Date;
}

export interface Bet {
  _id?: ObjectId;
  userId: ObjectId;
  roundId: ObjectId;
  amount: number;
  autoCashout: number | null;
  cashoutMultiplier: number | null;
  payout: number;
  status: 'active' | 'cashed_out' | 'lost';
  createdAt: Date;
  settledAt?: Date;
}

export interface Transaction {
  _id?: ObjectId;
  userId: ObjectId;
  reference: string;
  amountNaira: number;
  amountUsd: number;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  paystackData?: any;
  createdAt: Date;
  completedAt?: Date;
}