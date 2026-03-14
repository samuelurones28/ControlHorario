import { FastifyInstance } from 'fastify'
import { prisma } from '../../../utils/prisma'
import bcrypt from 'bcryptjs'

/**
 * Platform Authentication Service
 * Handles platform login, token generation and 2FA
 */
export class PlatformAuthService {
  constructor(private app: FastifyInstance) {}

  /**
   * Primary logic inside auth service for login
   */
  async login(email: string, passwordHash: string) {
    // Left empty for direct logic in controller to utilize fastify reply nicely
  }

  /**
   * Generates isolated platform tokens
   */
  generateTokens(platformAdmin: { id: string, email: string, role: string }) {
    const payload = {
      id: platformAdmin.id,
      email: platformAdmin.email,
      role: platformAdmin.role,
      scope: 'platform' // Critical isolation point
    }

    const accessToken = this.app.jwt.sign(payload, { expiresIn: '15m' })
    const refreshToken = this.app.jwt.sign(payload, { expiresIn: '2h' })

    return { accessToken, refreshToken }
  }
}

