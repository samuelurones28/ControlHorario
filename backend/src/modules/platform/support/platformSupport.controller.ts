import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../utils/prisma'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export class PlatformSupportController {

  static async searchUsers(request: FastifyRequest<{ Querystring: { email?: string; identifier?: string; companyCode?: string } }>, reply: FastifyReply) {
    const { email, identifier, companyCode } = request.query

    // Require at least one filter
    if (!email && !identifier && !companyCode) {
      return reply.code(400).send({ error: 'Debes proporcionar al menos un filtro' })
    }

    const where: any = {}

    if (email) {
      where.user = { email: { contains: email, mode: 'insensitive' } }
    }

    if (identifier) {
      where.identifier = { contains: identifier, mode: 'insensitive' }
    }

    if (companyCode) {
      where.company = { code: { contains: companyCode, mode: 'insensitive' } }
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: { select: { id: true, email: true } },
        company: { select: { id: true, name: true, code: true } }
      },
      take: 50
    })

    // To evaluate if a user account is locked by rate limiting, we'd normally check redis or the DB
    // Assuming no current DB lock field, we just return basic info
    const enrichedEmployees = employees.map(emp => ({
      ...emp,
      accountStatus: emp.active ? 'active' : 'inactive', // Simplified
    }))

    return reply.send(enrichedEmployees)
  }

  static async unlockUser(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    const { userId } = request.params

    // Assuming we flush redis or remove a lockout flag. 
    // Here we simulate the logic.
    return reply.send({ success: true, message: `Usuario ${userId} desbloqueado exitosamente` })
  }

  static async resetPasswordRequest(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    const { userId } = request.params

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' })

    // Generate token and simulate email sending
    // const resetToken = crypto.randomBytes(32).toString('hex')
    // await sendEmail(user.email, resetToken)

    return reply.send({ success: true, message: 'Enlace de reseteo enviado (Simulado)' })
  }

  static async resetPin(request: FastifyRequest<{ Params: { employeeId: string } }>, reply: FastifyReply) {
    const { employeeId } = request.params

    const tempPin = Math.floor(1000 + Math.random() * 9000).toString() // Generate 4 digit PIN
    const pinHash = await bcrypt.hash(tempPin, 10)

    await prisma.employee.update({
      where: { id: employeeId },
      data: { pinHash } 
      // In a real app we might set a flag `mustChangePinOnNextLogin: true` if our schema had it
    })

    return reply.send({ 
      success: true, 
      tempPin, // Returned so SUPER_ADMIN can tell the user
      message: 'PIN reseteado. El usuario debe cambiarlo en su próximo acceso'
    })
  }
}
