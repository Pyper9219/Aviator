import { connectToDatabase } from '../../lib/mongodb';
import { hashPassword, signToken } from '../../lib/auth';
import { createUserDefaults } from '../../lib/models/User';
import { isValidEmail, isValidUsername, sanitizeString } from '../../lib/validate';
import { rateLimit, getClientIp } from '../../lib/rate-limit';
import { logger } from '../../lib/logger';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);
  if (!rateLimit(`register:${ip}`, 5, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
  }

  const email = sanitizeString(req.body.email, 100).toLowerCase();
  const username = sanitizeString(req.body.username, 20);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
  }

  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be 8-128 characters' });
  }

  try {
    const { db } = await connectToDatabase();

    const existing = await db.collection('users').findOne({
      $or: [{ email }, { username }],
    });

    if (existing) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = createUserDefaults(email, username, passwordHash);

    const result = await db.collection('users').insertOne(user);
    const token = signToken({ userId: result.insertedId.toString(), email });

    logger.info('User registered', { userId: result.insertedId.toString(), email });

    return res.status(201).json({
      token,
      user: {
        id: result.insertedId.toString(),
        email,
        username,
        balance: 0,
        clientSeed: user.clientSeed,
      },
    });
  } catch (error: any) {
    logger.error('Register error', { error: error.message });
    return res.status(500).json({ error: 'Registration failed' });
  }
}