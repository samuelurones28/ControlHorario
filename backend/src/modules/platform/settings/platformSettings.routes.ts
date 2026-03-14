import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { platformAuthenticate } from '../../../middleware/platformAuthenticate'
import { platformAuthorize } from '../../../middleware/platformAuthorize'
import { platformAuditLogger } from '../../../middleware/platformAuditLogger'
import { platformStandardRateLimit } from '../../../middleware/platformRateLimiter'
import { PlatformSettingsController } from './platformSettings.controller'

export const platformSettingsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preValidation', platformAuthenticate)
  fastify.addHook('onResponse', platformAuditLogger)

  fastify.get('/', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
  }, PlatformSettingsController.getSettings)

  fastify.patch('/:key', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformSettingsController.updateSetting as any)
}
