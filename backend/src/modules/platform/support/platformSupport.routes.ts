import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { platformAuthenticate } from '../../../middleware/platformAuthenticate'
import { platformAuthorize } from '../../../middleware/platformAuthorize'
import { platformAuditLogger } from '../../../middleware/platformAuditLogger'
import { platformStandardRateLimit } from '../../../middleware/platformRateLimiter'
import { PlatformSupportController } from './platformSupport.controller'

export const platformSupportRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preValidation', platformAuthenticate)
  fastify.addHook('onResponse', platformAuditLogger)

  fastify.get('/users/search', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT'])
  }, PlatformSupportController.searchUsers as any)

  fastify.post('/users/:userId/unlock', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT'])
  }, PlatformSupportController.unlockUser as any)

  fastify.post('/users/:userId/reset-password-request', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformSupportController.resetPasswordRequest as any)

  fastify.post('/employees/:employeeId/reset-pin', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT'])
  }, PlatformSupportController.resetPin as any)
}
