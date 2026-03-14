"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformAuthenticate = platformAuthenticate;
async function platformAuthenticate(request, reply) {
    try {
        // Relying on fastify/jwt configured instance
        await request.jwtVerify();
        // The user prop gets populated by jwtVerify if successful
        const decoded = request.user;
        // Check if the token has the platform scope
        if (decoded.scope !== 'platform') {
            return reply.code(403).send({ error: 'Access denied: Invalid token scope' });
        }
        // Attach platformAdmin to the request object
        request.platformAdmin = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
    }
    catch (err) {
        return reply.code(401).send({ error: 'Unauthorized', details: err.message });
    }
}
