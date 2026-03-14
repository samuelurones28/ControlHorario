import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { platformAuthenticate } from '../../../middleware/platformAuthenticate'
import { platformAuthorize } from '../../../middleware/platformAuthorize'
import { platformAuditLogger } from '../../../middleware/platformAuditLogger'
import { platformStandardRateLimit } from '../../../middleware/platformRateLimiter'
import { PlatformAdminsController } from './platformAdmins.controller'

export const platformAdminsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preValidation', platformAuthenticate)
  fastify.addHook('onResponse', platformAuditLogger)

  fastify.get('/', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformAdminsController.getAdmins as any)

  fastify.post('/', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformAdminsController.createAdmin as any)

  fastify.patch('/:id', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformAdminsController.updateAdmin as any)

  fastify.delete('/:id', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformAdminsController.deleteAdmin as any)
}
