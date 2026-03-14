import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { platformAuthenticate } from '../../../middleware/platformAuthenticate'
import { platformAuthorize } from '../../../middleware/platformAuthorize'
import { platformStandardRateLimit } from '../../../middleware/platformRateLimiter'
import { PlatformMonitoringController } from './platformMonitoring.controller'

export const platformMonitoringRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.addHook('preValidation', platformAuthenticate)

  fastify.get('/jobs', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
  }, PlatformMonitoringController.getJobsStatus)

  fastify.get('/errors', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
  }, PlatformMonitoringController.getRecentErrors as any)

  fastify.get('/metrics', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
  }, PlatformMonitoringController.getMetrics as any)
}
