import { FastifyInstance } from 'fastify';
import { registerHandler } from './register';
import { loginHandler } from './login';
import { meHandler } from './me';
import { usageStatsHandler } from './usage';
import { authenticate } from '../../plugins/jwt';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', registerHandler);
  app.post('/login', loginHandler);
  app.get('/me', { preHandler: authenticate }, meHandler);
  app.get('/usage', { preHandler: authenticate }, usageStatsHandler);
}
