import { FastifyReply, FastifyRequest } from 'fastify'

export const platformAuthorize = (allowedRoles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = request.platformAdmin

    if (!admin) {
      return reply.code(401).send({ error: 'Unauthorized: No active admin session found' })
    }

    if (!allowedRoles.includes(admin.role)) {
      return reply.code(403).send({ error: 'Forbidden: Insufficient platform permissions' })
    }
  }
}
