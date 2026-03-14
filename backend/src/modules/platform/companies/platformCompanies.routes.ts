import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { platformAuthenticate } from '../../../middleware/platformAuthenticate'
import { platformAuthorize } from '../../../middleware/platformAuthorize'
import { platformAuditLogger } from '../../../middleware/platformAuditLogger'
import { platformStandardRateLimit } from '../../../middleware/platformRateLimiter'
import { PlatformCompaniesController } from './platformCompanies.controller'

export const platformCompaniesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preValidation', platformAuthenticate)
  fastify.addHook('onResponse', platformAuditLogger)

  fastify.get('/', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
  }, PlatformCompaniesController.listCompanies as any)

  fastify.get('/:id', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
  }, PlatformCompaniesController.getCompanyDetail as any)

  fastify.patch('/:id/status', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN'])
  }, PlatformCompaniesController.updateCompanyStatus as any)

  fastify.get('/:id/audit-log', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT'])
  }, PlatformCompaniesController.getCompanyAuditLog as any)
}
