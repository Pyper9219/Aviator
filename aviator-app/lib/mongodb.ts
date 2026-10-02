// lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const options = {
  maxPoolSize: 5,       // Small pool per serverless instance [citation:9]
  minPoolSize: 0,       // Don't hold idle connections
  maxIdleTimeMS: 10000, // Close idle after 10s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, options);
  await client.connect();
  const db = client.db('aviator');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}