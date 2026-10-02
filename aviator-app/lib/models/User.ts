import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  balance: number;
  clientSeed: string;
  totalWagered: number;
  totalWon: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createUserDefaults(email: string, username: string, passwordHash: string): User {
  return {
    email,
    username,
    passwordHash,
    balance: 0,
    clientSeed: Math.random().toString(36).substring(2, 15),
    totalWagered: 0,
    totalWon: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}