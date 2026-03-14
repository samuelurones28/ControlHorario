import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { platformAuthenticate } from '../../../middleware/platformAuthenticate'
import { platformAuthorize } from '../../../middleware/platformAuthorize'
import { platformStandardRateLimit } from '../../../middleware/platformRateLimiter'
import { PlatformDashboardController } from './platformDashboard.controller'

export const platformDashboardRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Apply platform middlewares to all routes in this plugin
  fastify.addHook('preValidation', platformAuthenticate)

  fastify.get('/', {
    ...platformStandardRateLimit,
    preHandler: platformAuthorize(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
  }, PlatformDashboardController.getDashboard)
}
