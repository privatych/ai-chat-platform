import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/jwt';
import { createPaymentHandler } from './create-payment';
import { statusHandler } from './status';
import { webhookHandler } from './webhook';

export async function subscriptionRoutes(app: FastifyInstance) {
  // Webhook route MUST be registered BEFORE auth hook (no auth for webhooks)
  app.post('/webhook', {
    config: {
      // Rate limit: 100 requests per minute globally for webhook
      rateLimit: {
        max: 100,
        timeWindow: '1 minute',
      },
    },
  }, webhookHandler);

  // All other subscription routes require authentication
  app.addHook('preHandler', authenticate);

  // Create payment for new subscription
  app.post('/create-payment', createPaymentHandler);

  // Get subscription status
  app.get('/status', statusHandler);
}
