"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
function authorize(roles) {
    return async (request, reply) => {
        const tenant = request.tenant;
        if (!tenant || !roles.includes(tenant.role)) {
            return reply.status(403).send({ message: 'Forbidden: Insufficient permissions' });
        }
    };
}
