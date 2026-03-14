import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { auditLogger } from '../../middleware/auditLogger';
import { authenticate } from '../../middleware/authenticate';
import { loginRateLimiter } from '../../middleware/loginRateLimiter';

export async function authRoutes(app: FastifyInstance) {
  const authController = new AuthController();

  app.addHook('onResponse', auditLogger);

  app.post('/register-company', authController.registerCompany.bind(authController));
  app.post('/login/admin', { preHandler: loginRateLimiter }, authController.adminLogin.bind(authController));
  app.post('/login/employee', { preHandler: loginRateLimiter }, authController.employeeLogin.bind(authController));
  app.post('/refresh', authController.refresh.bind(authController));
  app.post('/logout', authController.logout.bind(authController));
  app.get('/me', { preHandler: authenticate }, authController.getMe.bind(authController));
}
