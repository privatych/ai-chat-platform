import { FastifyInstance } from 'fastify';
import { registerHandler } from './register';
import { loginHandler } from './login';
import { meHandler } from './me';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', registerHandler);
  app.post('/login', loginHandler);
  app.get('/me', { onRequest: [app.authenticate] }, meHandler);
}
