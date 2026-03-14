import { FastifyReply, FastifyRequest } from 'fastify';
import { Role } from '@prisma/client';

export function authorize(roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenant = request.tenant;
    
    if (!tenant || !roles.includes(tenant.role as Role)) {
      return reply.status(403).send({ message: 'Forbidden: Insufficient permissions' });
    }
  };
}
