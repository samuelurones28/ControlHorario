import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../utils/prisma'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { LoginInput, SetupTotpInput, VerifyTotpInput, VerifyRecoveryInput } from './platformAuth.schemas'
import { TotpService } from './totp.service'

/**
 * Platform Authentication Controller
 */
export class PlatformAuthController {

  static async login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
    const { email, password } = request.body

    const admin = await prisma.platformAdmin.findUnique({ where: { email } })

    if (!admin || !admin.active) {
      // Return ambiguous error to prevent email enumeration
      return reply.code(401).send({ error: 'Credenciales inválidas' })
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash)

    if (!isValid) {
      return reply.code(401).send({ error: 'Credenciales inválidas' })
    }

    // 2FA deshabilitado durante desarrollo
    return PlatformAuthController.generateAndSendTokens(request, reply, admin)
  }

  static async verifyTotp(request: FastifyRequest<{ Body: VerifyTotpInput }>, reply: FastifyReply) {
    const { email, totpCode } = request.body

    const admin = await prisma.platformAdmin.findUnique({ where: { email } })

    if (!admin || !admin.active || !admin.totpSecret) {
      return reply.code(401).send({ error: 'Credenciales inválidas o 2FA no configurado' })
    }

    // Verify TOTP
    const isValidTotp = TotpService.verify(admin.totpSecret, totpCode)

    if (!isValidTotp) {
      return reply.code(401).send({ error: 'Código TOTP inválido' })
    }

    // Success
    await prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    })

    return PlatformAuthController.generateAndSendTokens(request, reply, admin)
  }

  static async setupTotp(request: FastifyRequest<{ Body: SetupTotpInput & { email: string, secret: string } }>, reply: FastifyReply) {
    const { email, totpCode, secret } = request.body

    const admin = await prisma.platformAdmin.findUnique({ where: { email } })

    if (!admin || !admin.active) return reply.code(401).send({ error: 'Unauthorized' })

    const isValid = TotpService.verify(secret, totpCode)

    if (!isValid) {
      return reply.code(400).send({ error: 'El código TOTP es inválido' })
    }

    // Valid setup. Generate backup codes
    const plainCodes = TotpService.generateBackupCodes()
    
    // Hash codes and save
    const hashedCodes = await Promise.all(
      plainCodes.map(code => bcrypt.hash(code, 10))
    )

    await prisma.$transaction([
      prisma.platformAdmin.update({
        where: { id: admin.id },
        data: { totpSecret: secret }
      }),
      prisma.platformBackupCode.createMany({
        data: hashedCodes.map(hash => ({
          platformAdminId: admin.id,
          codeHash: hash
        }))
      })
    ])

    return PlatformAuthController.generateAndSendTokens(request, reply, admin, plainCodes)
  }

  static async verifyRecoveryCode(request: FastifyRequest<{ Body: VerifyRecoveryInput }>, reply: FastifyReply) {
    const { email, recoveryCode } = request.body

    const admin = await prisma.platformAdmin.findUnique({ where: { email } })

    if (!admin || !admin.active || !admin.totpSecret) {
      return reply.code(401).send({ error: 'Credenciales inválidas o 2FA no configurado' })
    }

    // Normalize recovery code: uppercase, remove dashes and spaces
    const normalizedCode = recoveryCode.toUpperCase().replace(/[\s-]/g, '')

    // Get all unused recovery codes for this admin
    const backupCodes = await prisma.platformBackupCode.findMany({
      where: { platformAdminId: admin.id, usedAt: null }
    })

    // Check if the provided code matches any unused backup code
    let matchedCode = null
    for (const code of backupCodes) {
      const isValid = await bcrypt.compare(normalizedCode, code.codeHash)
      if (isValid) {
        matchedCode = code
        break
      }
    }

    if (!matchedCode) {
      return reply.code(401).send({ error: 'Código de recuperación inválido' })
    }

    // Mark the code as used and update last login
    await prisma.$transaction([
      prisma.platformBackupCode.update({
        where: { id: matchedCode.id },
        data: { usedAt: new Date() }
      }),
      prisma.platformAdmin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() }
      })
    ])

    return PlatformAuthController.generateAndSendTokens(request, reply, admin)
  }

  static async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.rt_platform

    if (!refreshToken) {
      return reply.code(401).send({ error: 'No refresh token' })
    }

    try {
      const decoded = request.server.jwt.verify(refreshToken) as any
      
      if (decoded.scope !== 'platform') {
        throw new Error('Invalid token scope')
      }

      const accessToken = request.server.jwt.sign({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        scope: 'platform'
      }, { expiresIn: '15m' })

      return reply.send({ accessToken })

    } catch (err) {
      reply.clearCookie('rt_platform', { path: '/api/v1/platform/auth' })
      return reply.code(401).send({ error: 'Invalid refresh token' })
    }
  }

  static async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('rt_platform', { path: '/api/v1/platform/auth' })
    return reply.send({ success: true })
  }

  // --- Helpers ---

  private static generateAndSendTokens(request: FastifyRequest, reply: FastifyReply, admin: any, backupCodes?: string[]) {
    const payload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      scope: 'platform'
    }

    const accessToken = request.server.jwt.sign(payload, { expiresIn: '15m' })
    const refreshToken = request.server.jwt.sign(payload, { expiresIn: '2h' })

    // Set isolated cookie
    reply.setCookie('rt_platform', refreshToken, {
      path: '/api/v1/platform/auth',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7200 // 2 hours
    })

    const responseFormat: any = {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }
    }
    if (backupCodes) responseFormat.backupCodes = backupCodes

    return reply.send(responseFormat)
  }
}
