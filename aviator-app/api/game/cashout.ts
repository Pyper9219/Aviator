import { connectToDatabase } from '../../lib/mongodb';
import { extractToken, verifyToken } from '../../lib/auth';
import { ObjectId } from 'mongodb';
import { logger } from '../../lib/logger';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { betId } = req.body;
  if (!betId) return res.status(400).json({ error: 'betId required' });

  try {
    const { db } = await connectToDatabase();

    const bet = await db.collection('bets').findOne({
      _id: new ObjectId(betId),
      userId: new ObjectId(payload.userId),
      status: 'active',
    });

    if (!bet) return res.status(404).json({ error: 'Active bet not found' });

    const round = await db.collection('rounds').findOne({ _id: bet.roundId });
    if (!round) return res.status(404).json({ error: 'Round not found' });

    if (round.status === 'completed') {
      await db.collection('bets').updateOne(
        { _id: bet._id },
        { $set: { status: 'lost', settledAt: new Date() } }
      );
      return res.status(400).json({ error: 'Round already crashed' });
    }

    const elapsed = (Date.now() - new Date(round.startedAt).getTime()) / 1000;
    const serverMultiplier = 1 + elapsed * 0.1;

    if (serverMultiplier >= round.crashPoint) {
      await db.collection('bets').updateOne(
        { _id: bet._id },
        { $set: { status: 'lost', settledAt: new Date() } }
      );
      return res.status(400).json({ error: 'Too late — round crashed' });
    }

    const cashoutMultiplier = parseFloat(serverMultiplier.toFixed(2));
    const payout = parseFloat((bet.amount * cashoutMultiplier).toFixed(2));

    const updateResult = await db.collection('bets').findOneAndUpdate(
      { _id: bet._id, status: 'active' },
      {
        $set: {
          status: 'cashed_out',
          cashoutMultiplier,
          payout,
          settledAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!updateResult) return res.status(400).json({ error: 'Bet already settled' });

    const user = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(payload.userId) },
      { $inc: { balance: payout, totalWon: payout } },
      { returnDocument: 'after' }
    );

    logger.info('Cashout', {
      userId: payload.userId,
      betId,
      multiplier: cashoutMultiplier,
      payout,
    });

    return res.status(200).json({
      success: true,
      payout,
      cashoutMultiplier,
      newBalance: user!.balance,
    });
  } catch (error: any) {
    logger.error('Cashout error', { error: error.message });
    return res.status(500).json({ error: 'Cashout failed' });
  }
}