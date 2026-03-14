import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/authorize';
import { checkPrivacyConsent, acceptPrivacyConsent, getPrivacyPolicy } from './privacy.controller';

export const privacyRoutes: FastifyPluginAsync = async (app) => {
  app.get('/policy', getPrivacyPolicy);

  app.get('/me', {
    preHandler: [authorize(['EMPLOYEE', 'ADMIN'])]
  }, checkPrivacyConsent);

  app.post('/accept', {
    preHandler: [authorize(['EMPLOYEE', 'ADMIN'])]
  }, acceptPrivacyConsent as any);
};
