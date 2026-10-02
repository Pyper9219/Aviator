import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { db } = await connectToDatabase();

    const rounds = await db
      .collection('rounds')
      .find({ status: 'completed' })
      .sort({ roundNumber: -1 })
      .limit(50)
      .toArray();

    return res.status(200).json({
      rounds: rounds.map((r) => ({
        roundNumber: r.roundNumber,
        crashPoint: r.crashPoint,
        serverSeedHash: r.serverSeedHash,
        completedAt: r.crashedAt,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}