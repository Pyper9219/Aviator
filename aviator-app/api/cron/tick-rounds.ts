import { connectToDatabase } from '../../lib/mongodb';
import { calculateCrashPoint, generateServerSeed } from '../../lib/fairness';

export default async function handler(req: any, res: any) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { db } = await connectToDatabase();

    let activeRound = await db.collection('rounds').findOne({
      status: { $in: ['pending', 'active'] },
    });

    if (activeRound) {
      const elapsed = (Date.now() - new Date(activeRound.startedAt).getTime()) / 1000;

      if (activeRound.status === 'pending' && elapsed >= 5) {
        const crashPoint = calculateCrashPoint(
          activeRound.serverSeed,
          activeRound.clientSeed,
          activeRound.nonce
        );

        await db.collection('rounds').updateOne(
          { _id: activeRound._id },
          {
            $set: {
              status: 'active',
              crashPoint,
              startedAt: new Date(),
            },
          }
        );

        return res.status(200).json({ status: 'round_started', roundNumber: activeRound.roundNumber });
      }

      if (activeRound.status === 'active') {
        const currentMultiplier = 1 + elapsed * 0.1;

        if (currentMultiplier >= activeRound.crashPoint) {
          await db.collection('rounds').updateOne(
            { _id: activeRound._id },
            {
              $set: {
                status: 'completed',
                crashedAt: new Date(),
              },
            }
          );

          await db.collection('bets').updateMany(
            { roundId: activeRound._id, status: 'active' },
            { $set: { status: 'lost', settledAt: new Date() } }
          );

          return res.status(200).json({ status: 'round_crashed', crashPoint: activeRound.crashPoint });
        }
      }

      return res.status(200).json({ status: 'active', currentMultiplier: 1 + elapsed * 0.1 });
    }

    const lastRound = await db.collection('rounds').findOne(
      { status: 'completed' },
      { sort: { roundNumber: -1 } }
    );

    const nextRoundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
    const { seed, hash } = generateServerSeed();

    await db.collection('rounds').insertOne({
      roundNumber: nextRoundNumber,
      serverSeed: seed,
      serverSeedHash: hash,
      clientSeed: 'default_client_seed',
      nonce: nextRoundNumber,
      crashPoint: 0,
      status: 'pending',
      startedAt: new Date(),
      createdAt: new Date(),
    });

    return res.status(200).json({ status: 'new_round_created', roundNumber: nextRoundNumber });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}