"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformAdminsRoutes = void 0;
const platformAuthenticate_1 = require("../../../middleware/platformAuthenticate");
const platformAuthorize_1 = require("../../../middleware/platformAuthorize");
const platformAuditLogger_1 = require("../../../middleware/platformAuditLogger");
const platformRateLimiter_1 = require("../../../middleware/platformRateLimiter");
const platformAdmins_controller_1 = require("./platformAdmins.controller");
const platformAdminsRoutes = async (fastify) => {
    fastify.addHook('preValidation', platformAuthenticate_1.platformAuthenticate);
    fastify.addHook('onResponse', platformAuditLogger_1.platformAuditLogger);
    fastify.get('/', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformAdmins_controller_1.PlatformAdminsController.getAdmins);
    fastify.post('/', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformAdmins_controller_1.PlatformAdminsController.createAdmin);
    fastify.patch('/:id', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformAdmins_controller_1.PlatformAdminsController.updateAdmin);
    fastify.delete('/:id', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformAdmins_controller_1.PlatformAdminsController.deleteAdmin);
};
exports.platformAdminsRoutes = platformAdminsRoutes;
