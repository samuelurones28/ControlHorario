import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../utils/prisma'
import bcrypt from 'bcryptjs'

export class PlatformAdminsController {

  static async getAdmins(request: FastifyRequest, reply: FastifyReply) {
    const admins = await prisma.platformAdmin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        totpSecret: true // Not returning secret, just resolving boolean below
      },
      orderBy: { createdAt: 'desc' }
    })

    return reply.send(admins.map(a => ({
      ...a,
      has2FA: !!a.totpSecret,
      totpSecret: undefined
    })))
  }

  static async createAdmin(request: FastifyRequest<{ Body: { email: string; name: string; role: any; password: string } }>, reply: FastifyReply) {
    const { email, name, role, password } = request.body

    const existingUser = await prisma.platformAdmin.findUnique({ where: { email } })
    if (existingUser) {
      return reply.code(400).send({ error: 'El email ya está en uso' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const admin = await prisma.platformAdmin.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        active: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    })

    return reply.code(201).send(admin)
  }

  static async updateAdmin(request: FastifyRequest<{ Params: { id: string }, Body: { role?: any; active?: boolean } }>, reply: FastifyReply) {
    const { id } = request.params
    const { role, active } = request.body

    const adminToUpdate = await prisma.platformAdmin.findUnique({ where: { id } })
    if (!adminToUpdate) return reply.code(404).send({ error: 'Admin no encontrado' })

    // Check if trying to deactivate the last active super admin
    if (active === false && adminToUpdate.role === 'SUPER_ADMIN') {
      const activeSuperAdmins = await prisma.platformAdmin.count({
        where: { role: 'SUPER_ADMIN', active: true }
      })
      if (activeSuperAdmins <= 1) {
        return reply.code(400).send({ error: 'No puedes desactivar al último SUPER_ADMIN activo' })
      }
    }

    // Check if trying to remove super admin role from last active super admin
    if (role && role !== 'SUPER_ADMIN' && adminToUpdate.role === 'SUPER_ADMIN' && adminToUpdate.active) {
      const activeSuperAdmins = await prisma.platformAdmin.count({
        where: { role: 'SUPER_ADMIN', active: true }
      })
      if (activeSuperAdmins <= 1) {
        return reply.code(400).send({ error: 'No puedes quitar el rol SUPER_ADMIN al último activo' })
      }
    }

    const updated = await prisma.platformAdmin.update({
      where: { id },
      data: { role, active },
      select: { id: true, email: true, name: true, role: true, active: true }
    })

    return reply.send(updated)
  }

  static async deleteAdmin(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params

    const admin = await prisma.platformAdmin.findUnique({ where: { id } })
    if (!admin) return reply.code(404).send({ error: 'Admin no encontrado' })

    if (admin.role === 'SUPER_ADMIN' && admin.active) {
      const activeSuperAdmins = await prisma.platformAdmin.count({
        where: { role: 'SUPER_ADMIN', active: true }
      })
      if (activeSuperAdmins <= 1) {
        return reply.code(400).send({ error: 'No puedes eliminar al último SUPER_ADMIN activo' })
      }
    }

    await prisma.platformAdmin.update({
      where: { id },
      data: { active: false } // Soft delete
    })

    return reply.send({ success: true, message: 'Administrador desactivado correctamente' })
  }
}
