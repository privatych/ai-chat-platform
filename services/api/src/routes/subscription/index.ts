import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/jwt';
import { createPaymentHandler } from './create-payment';
import { statusHandler } from './status';
import { cancelHandler } from './cancel';

export async function subscriptionRoutes(app: FastifyInstance) {
  // All subscription routes require authentication
  app.addHook('preHandler', authenticate);

  // Create payment for new subscription
  app.post('/create-payment', createPaymentHandler);

  // Get subscription status
  app.get('/status', statusHandler);

  // Cancel subscription
  app.post('/cancel', cancelHandler);
}
