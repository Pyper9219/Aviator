import { connectToDatabase } from '../../lib/mongodb';
import { verifyPayment } from '../../lib/paystack';
import { extractToken, verifyToken } from '../../lib/auth';
import { logger } from '../../lib/logger';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { reference } = req.query;
  if (!reference) return res.status(400).json({ error: 'Reference required' });

  try {
    const { db } = await connectToDatabase();

    const tx = await db.collection('transactions').findOne({
      reference,
      userId: (await import('mongodb')).ObjectId.createFromHexString(payload.userId),
    });

    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    if (tx.status === 'completed') {
      const user = await db.collection('users').findOne({ _id: tx.userId });
      return res.status(200).json({
        success: true,
        message: 'Already credited',
        amount: tx.amountUsd,
        newBalance: user!.balance,
      });
    }

    const paymentData = await verifyPayment(reference);

    if (paymentData.status !== 'success') {
      await db.collection('transactions').updateOne(
        { reference },
        { $set: { status: 'failed', completedAt: new Date() } }
      );
      return res.status(400).json({ error: 'Payment not successful' });
    }

    const user = await db.collection('users').findOneAndUpdate(
      { _id: tx.userId },
      { $inc: { balance: tx.amountUsd } },
      { returnDocument: 'after' }
    );

    await db.collection('transactions').updateOne(
      { reference },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          paystackData: paymentData,
        },
      }
    );

    logger.info('Deposit verified', { userId: payload.userId, reference, amount: tx.amountUsd });

    return res.status(200).json({
      success: true,
      newBalance: user!.balance,
      amount: tx.amountUsd,
    });
  } catch (error: any) {
    logger.error('Deposit verify error', { error: error.message });
    return res.status(500).json({ error: 'Verification failed' });
  }
}