import { connectToDatabase } from '../../lib/mongodb';
import { extractToken, verifyToken } from '../../lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { db } = await connectToDatabase();

    const bets = await db
      .collection('bets')
      .find({ userId: new ObjectId(payload.userId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.status(200).json({
      bets: bets.map((b) => ({
        id: b._id.toString(),
        roundId: b.roundId.toString(),
        amount: b.amount,
        autoCashout: b.autoCashout,
        cashoutMultiplier: b.cashoutMultiplier,
        payout: b.payout,
        status: b.status,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}