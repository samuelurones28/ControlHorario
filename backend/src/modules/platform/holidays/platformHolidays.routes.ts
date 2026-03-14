import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { platformAuthenticate } from '../../../middleware/platformAuthenticate'
import { platformAuthorize } from '../../../middleware/platformAuthorize'
import { platformAuditLogger } from '../../../middleware/platformAuditLogger'
import { platformStandardRateLimit } from '../../../middleware/platformRateLimiter'
import { PlatformHolidaysController } from './platformHolidays.controller'

export const platformHolidaysRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preValidation', platformAuthenticate)
  fastify.addHook('onResponse', platformAuditLogger)

  fastify.get('/', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
  }, PlatformHolidaysController.getHolidays as any)

  fastify.post('/', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformHolidaysController.createHoliday as any)

  fastify.put('/:id', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformHolidaysController.updateHoliday as any)

  fastify.delete('/:id', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformHolidaysController.deleteHoliday as any)
}
