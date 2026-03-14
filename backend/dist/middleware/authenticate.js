"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
async function authenticate(request, reply) {
    try {
        const decoded = await request.jwtVerify();
        request.tenant = {
            companyId: decoded.companyId,
            userId: decoded.userId,
            employeeId: decoded.id,
            role: decoded.role
        };
    }
    catch (err) {
        return reply.status(401).send({ message: 'Unauthorized: Invalid or missing token' });
    }
}
