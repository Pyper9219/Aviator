import { connectToDatabase } from '../../lib/mongodb';
import { initializePayment } from '../../lib/paystack';
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
  if (!rateLimit(`deposit:${payload.userId}:${ip}`, 10, 60_000)) {
    return res.status(429).json({ error: 'Too many deposit attempts' });
  }

  const { amount } = req.body;

  if (!isValidAmount(amount) || amount < 10 || amount > 10000) {
    return res.status(400).json({ error: 'Deposit must be between $10 and $10,000' });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const reference = `aviator_${payload.userId}_${Date.now()}`;
    const amountNaira = amount * 1500;

    const paymentData = await initializePayment(
      user.email,
      amountNaira,
      reference,
      `${process.env.APP_URL}/verify-payment.html?ref=${reference}`
    );

    await db.collection('transactions').insertOne({
      userId: new ObjectId(payload.userId),
      reference,
      amountNaira,
      amountUsd: amount,
      type: 'deposit',
      status: 'pending',
      createdAt: new Date(),
    });

    logger.info('Deposit initialized', { userId: payload.userId, reference, amount });

    return res.status(200).json({
      authorizationUrl: paymentData.authorization_url,
      reference,
      accessCode: paymentData.access_code,
    });
  } catch (error: any) {
    logger.error('Deposit init error', { error: error.message });
    return res.status(500).json({ error: 'Failed to initialize deposit' });
  }
}