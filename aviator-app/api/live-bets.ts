import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'no-store');

  try {
    const { db } = await connectToDatabase();

    const round = await db.collection('rounds').findOne({
      status: { $in: ['pending', 'active'] },
    });

    if (!round) return res.status(200).json({ bets: [] });

    const bets = await db
      .collection('bets')
      .aggregate([
        { $match: { roundId: round._id } },
        { $sort: { amount: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            username: '$user.username',
            amount: 1,
            autoCashout: 1,
            cashoutMultiplier: 1,
            payout: 1,
            status: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({ bets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}