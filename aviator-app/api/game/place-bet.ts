import { connectToDatabase } from '../../lib/mongodb';
import { extractToken, verifyToken } from '../../lib/auth';
import { ObjectId } from 'mongodb';
import { rateLimit, getClientIp } from '../../lib/rate-limit';
import { isValidAmount } from '../../lib/validate';
import { logger } from '../../lib/logger';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const ip = getClientIp(req);
  if (!rateLimit(`bet:${payload.userId}:${ip}`, 20, 60_000)) {
    return res.status(429).json({ error: 'Too many bet attempts' });
  }

  const { amount, autoCashout } = req.body;

  if (!isValidAmount(amount)) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  if (autoCashout !== null && autoCashout !== undefined) {
    if (!isValidAmount(autoCashout) || autoCashout < 1.01 || autoCashout > 1000) {
      return res.status(400).json({ error: 'Auto cashout must be between 1.01x and 1000x' });
    }
  }

  try {
    const { db } = await connectToDatabase();
    const userId = new ObjectId(payload.userId);

    const round = await db.collection('rounds').findOne({
      status: { $in: ['pending', 'active'] },
    });

    if (!round) return res.status(400).json({ error: 'No active round' });

    if (round.status === 'active') {
      const elapsed = (Date.now() - new Date(round.startedAt).getTime()) / 1000;
      if (elapsed > 3) {
        return res.status(400).json({ error: 'Betting window closed for this round' });
      }
    }

    const existing = await db.collection('bets').findOne({
      userId,
      roundId: round._id,
      status: 'active',
    });

    if (existing) return res.status(400).json({ error: 'You already have an active bet this round' });

    const user = await db.collection('users').findOneAndUpdate(
      { _id: userId, balance: { $gte: amount } },
      { $inc: { balance: -amount, totalWagered: amount } },
      { returnDocument: 'after' }
    );

    if (!user) return res.status(400).json({ error: 'Insufficient balance' });

    const betDoc = {
      userId,
      roundId: round._id,
      amount,
      autoCashout: autoCashout || null,
      cashoutMultiplier: null,
      payout: 0,
      status: 'active',
      createdAt: new Date(),
    };

    const betResult = await db.collection('bets').insertOne(betDoc);

    logger.info('Bet placed', {
      userId: payload.userId,
      amount,
      roundNumber: round.roundNumber,
    });

    return res.status(200).json({
      betId: betResult.insertedId.toString(),
      roundId: round._id.toString(),
      roundNumber: round.roundNumber,
      amount,
      autoCashout: autoCashout || null,
      newBalance: user.balance,
    });
  } catch (error: any) {
    logger.error('Place bet error', { error: error.message });
    return res.status(500).json({ error: 'Failed to place bet' });
  }
}