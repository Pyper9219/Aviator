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
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      balance: user.balance,
      clientSeed: user.clientSeed,
      totalWagered: user.totalWagered,
      totalWon: user.totalWon,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}