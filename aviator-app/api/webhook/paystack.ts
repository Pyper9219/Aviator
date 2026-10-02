import { connectToDatabase } from '../../lib/mongodb';
import { verifyWebhookSignature } from '../../lib/paystack';
import { logger } from '../../lib/logger';

export const config = { api: { bodyParser: false } };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  const signature = req.headers['x-paystack-signature'] as string;

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  if (event.event === 'charge.success') {
    const { reference, amount, customer } = event.data;

    try {
      const { db } = await connectToDatabase();

      const tx = await db.collection('transactions').findOne({
        reference,
        status: 'pending',
      });

      if (!tx) {
        logger.info('Webhook: already processed or unknown', { reference });
        return res.status(200).send('Already processed');
      }

      const user = await db.collection('users').findOne({ email: customer.email });
      if (!user) {
        logger.error('Webhook: user not found', { email: customer.email });
        return res.status(404).send('User not found');
      }

      await db.collection('users').updateOne(
        { _id: user._id },
        { $inc: { balance: tx.amountUsd } }
      );

      await db.collection('transactions').updateOne(
        { reference },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            paystackData: event.data,
          },
        }
      );

      logger.info('Webhook: deposit credited', {
        userId: user._id.toString(),
        reference,
        amount: tx.amountUsd,
      });
    } catch (error: any) {
      logger.error('Webhook processing error', { error: error.message });
      return res.status(500).send('Webhook processing failed');
    }
  }

  return res.status(200).send('OK');
}