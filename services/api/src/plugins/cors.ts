import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';

const corsPluginImpl: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });
};

export const corsPlugin = fp(corsPluginImpl);
