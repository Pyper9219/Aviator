import { connectToDatabase } from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

  try {
    const { db } = await connectToDatabase();

    const top = await db
      .collection('bets')
      .aggregate([
        { $match: { status: 'cashed_out' } },
        {
          $group: {
            _id: '$userId',
            totalWon: { $sum: '$payout' },
            biggestWin: { $max: '$payout' },
            biggestMultiplier: { $max: '$cashoutMultiplier' },
          },
        },
        { $sort: { totalWon: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            username: '$user.username',
            totalWon: 1,
            biggestWin: 1,
            biggestMultiplier: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({ leaderboard: top });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}