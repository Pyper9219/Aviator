import { connectToDatabase } from '../../lib/mongodb';
import { generateServerSeed, calculateCrashPoint } from '../../lib/fairness';
import { extractToken, verifyToken } from '../../lib/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { db } = await connectToDatabase();

    const activeRound = await db.collection('rounds').findOne({
      status: { $in: ['pending', 'active'] },
    });

    if (activeRound) {
      const elapsed = Date.now() - new Date(activeRound.startedAt).getTime();
      const currentMultiplier = 1 + (elapsed / 1000) * 0.1;

      return res.status(200).json({
        roundId: activeRound._id.toString(),
        roundNumber: activeRound.roundNumber,
        serverSeedHash: activeRound.serverSeedHash,
        status: activeRound.status,
        currentMultiplier: Math.min(currentMultiplier, activeRound.crashPoint),
        startedAt: activeRound.startedAt,
      });
    }

    const lastRound = await db.collection('rounds').findOne(
      { status: 'completed' },
      { sort: { roundNumber: -1 } }
    );

    const nextRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

    const { seed, hash } = generateServerSeed();

    const roundDoc = {
      roundNumber: nextRoundNumber,
      serverSeed: seed,
      serverSeedHash: hash,
      clientSeed: 'pending',
      nonce: nextRoundNumber,
      crashPoint: 0,
      status: 'pending',
      startedAt: new Date(),
      createdAt: new Date(),
    };

    const result = await db.collection('rounds').insertOne(roundDoc);

    return res.status(200).json({
      roundId: result.insertedId.toString(),
      roundNumber: nextRoundNumber,
      serverSeedHash: hash,
      status: 'pending',
      currentMultiplier: 1.0,
      startedAt: roundDoc.startedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}