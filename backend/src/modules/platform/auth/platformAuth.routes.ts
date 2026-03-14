import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { PlatformAuthController } from './platformAuth.controller'
import { platformLoginRateLimit, platformStandardRateLimit } from '../../../middleware/platformRateLimiter'

export const platformAuthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/login', {
    ...platformLoginRateLimit,
  }, PlatformAuthController.login)

  fastify.post('/login/verify-totp', {
    ...platformLoginRateLimit,
  }, PlatformAuthController.verifyTotp)

  fastify.post('/login/setup-totp', {
    ...platformStandardRateLimit,
  }, PlatformAuthController.setupTotp as any)

  fastify.post('/login/verify-recovery', {
    ...platformLoginRateLimit,
  }, PlatformAuthController.verifyRecoveryCode as any)

  fastify.post('/refresh', {
    ...platformStandardRateLimit,
  }, PlatformAuthController.refresh)

  fastify.post('/logout', {
    ...platformStandardRateLimit,
  }, PlatformAuthController.logout)
}
