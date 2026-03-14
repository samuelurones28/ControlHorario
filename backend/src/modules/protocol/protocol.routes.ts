import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/authorize';
import { downloadProtocol } from './protocol.controller';

export const protocolRoutes: FastifyPluginAsync = async (app) => {
  // Only admins can download the official protocol
  app.get('/download', {
    preHandler: [authorize(['ADMIN'])]
  }, downloadProtocol);
};
