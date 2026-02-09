import { FastifyInstance } from 'fastify';
import { registerHandler } from './register';
import { loginHandler } from './login';
import { meHandler } from './me';
import { usageStatsHandler } from './usage';
import { authenticate } from '../../plugins/jwt';

export async function authRoutes(app: FastifyInstance) {
  // Stricter rate limits for auth endpoints (5 attempts per 15 minutes)
  const authRateLimit = {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
  };

  app.post('/register', authRateLimit, registerHandler);
  app.post('/login', authRateLimit, loginHandler);
  app.get('/me', { preHandler: authenticate }, meHandler);
  app.get('/usage', { preHandler: authenticate }, usageStatsHandler);
}
