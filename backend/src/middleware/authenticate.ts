import { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: {
      companyId: string;
      userId: string;
      employeeId: string;
      role: string;
    }
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<{ companyId: string, userId: string, id: string, role: string }>();
    request.tenant = {
      companyId: decoded.companyId,
      userId: decoded.userId,
      employeeId: decoded.id,
      role: decoded.role
    };
  } catch (err) {
    return reply.status(401).send({ message: 'Unauthorized: Invalid or missing token' });
  }
}
