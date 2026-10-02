import { connectToDatabase } from '../../lib/mongodb';
import { verifyRound } from '../../lib/fairness';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { roundNumber } = req.query;
  if (!roundNumber) return res.status(400).json({ error: 'roundNumber required' });

  const parsed = parseInt(roundNumber as string, 10);
  if (isNaN(parsed) || parsed < 1) {
    return res.status(400).json({ error: 'Invalid roundNumber' });
  }

  try {
    const { db } = await connectToDatabase();

    const round = await db.collection('rounds').findOne({ roundNumber: parsed });

    if (!round) return res.status(404).json({ error: 'Round not found' });

    if (round.status !== 'completed') {
      return res.status(200).json({
        status: 'in_progress',
        roundNumber: round.roundNumber,
        serverSeedHash: round.serverSeedHash,
        message: 'Server seed will be revealed after round completes',
      });
    }

    const isValid = verifyRound(
      round.serverSeed,
      round.clientSeed,
      round.nonce,
      round.crashPoint
    );

    return res.status(200).json({
      status: 'completed',
      roundNumber: round.roundNumber,
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      crashPoint: round.crashPoint,
      verified: isValid,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}