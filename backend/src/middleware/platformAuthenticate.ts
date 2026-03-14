import { FastifyReply, FastifyRequest } from 'fastify'

// Defines module augmentation to include platformAdmin in the request
declare module 'fastify' {
  interface FastifyRequest {
    platformAdmin?: {
      id: string
      email: string
      role: 'SUPER_ADMIN' | 'SUPPORT' | 'VIEWER'
    }
  }
}

export async function platformAuthenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Relying on fastify/jwt configured instance
    await request.jwtVerify()

    // The user prop gets populated by jwtVerify if successful
    const decoded = request.user as any
    
    // Check if the token has the platform scope
    if (decoded.scope !== 'platform') {
      return reply.code(403).send({ error: 'Access denied: Invalid token scope' })
    }

    // Attach platformAdmin to the request object
    request.platformAdmin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    }
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized', details: (err as Error).message })
  }
}
