import { FastifyInstance } from 'fastify';
import { createPaymentHandler } from './create-payment';
import { statusHandler } from './status';
import { cancelHandler } from './cancel';
import { webhookHandler } from './webhook';

export async function subscriptionRoutes(app: FastifyInstance) {
  // Webhook doesn't require JWT, so register it before the hook
  app.post('/webhook', webhookHandler);

  // Require authentication for all user subscription routes
  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
  });

  app.post('/create-payment', createPaymentHandler);
  app.get('/status', statusHandler);
  app.post('/cancel', cancelHandler);
}
