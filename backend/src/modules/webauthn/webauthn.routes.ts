import { FastifyInstance } from 'fastify';
import { webAuthnController } from './webauthn.controller';
import { authenticate } from '../../middleware/authenticate';

export async function webauthnRoutes(app: FastifyInstance) {
  // Public endpoints (no auth required)
  app.post('/webauthn/authenticate/options', (req, reply) =>
    webAuthnController.authenticateOptions(req, reply)
  );

  app.post('/webauthn/authenticate/verify', (req, reply) =>
    webAuthnController.authenticateVerify(req, reply)
  );

  // Protected endpoints (auth required)
  app.post(
    '/webauthn/register/options',
    { preHandler: authenticate },
    (req, reply) => webAuthnController.registerOptions(req, reply)
  );

  app.post(
    '/webauthn/register/verify',
    { preHandler: authenticate },
    (req, reply) => webAuthnController.registerVerify(req, reply)
  );

  app.get(
    '/webauthn/credentials',
    { preHandler: authenticate },
    (req, reply) => webAuthnController.listCredentials(req, reply)
  );

  app.delete(
    '/webauthn/credentials/:credentialId',
    { preHandler: authenticate },
    (req, reply) => webAuthnController.deleteCredential(req, reply)
  );
}
