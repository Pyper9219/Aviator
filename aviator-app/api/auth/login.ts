import { connectToDatabase } from '../../lib/mongodb';
import { comparePassword, signToken } from '../../lib/auth';
import { sanitizeString } from '../../lib/validate';
import { rateLimit, getClientIp } from '../../lib/rate-limit';
import { logger } from '../../lib/logger';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return res.status(429).json({ error: 'Too many login attempts. Try again in a minute.' });
  }

  const email = sanitizeString(req.body.email, 100).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      await comparePassword('dummy', '$2a$10$dummyhashfordummycomparisonxxxxxxxxxxxxxxxxxxxxxxxxxx');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ userId: user._id.toString(), email: user.email });

    logger.info('User logged in', { userId: user._id.toString() });

    return res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        balance: user.balance,
        clientSeed: user.clientSeed,
      },
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message });
    return res.status(500).json({ error: 'Login failed' });
  }
}