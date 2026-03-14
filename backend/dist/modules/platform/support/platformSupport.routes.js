"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformSupportRoutes = void 0;
const platformAuthenticate_1 = require("../../../middleware/platformAuthenticate");
const platformAuthorize_1 = require("../../../middleware/platformAuthorize");
const platformAuditLogger_1 = require("../../../middleware/platformAuditLogger");
const platformRateLimiter_1 = require("../../../middleware/platformRateLimiter");
const platformSupport_controller_1 = require("./platformSupport.controller");
const platformSupportRoutes = async (fastify) => {
    fastify.addHook('preValidation', platformAuthenticate_1.platformAuthenticate);
    fastify.addHook('onResponse', platformAuditLogger_1.platformAuditLogger);
    fastify.get('/users/search', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT'])
    }, platformSupport_controller_1.PlatformSupportController.searchUsers);
    fastify.post('/users/:userId/unlock', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT'])
    }, platformSupport_controller_1.PlatformSupportController.unlockUser);
    fastify.post('/users/:userId/reset-password-request', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformSupport_controller_1.PlatformSupportController.resetPasswordRequest);
    fastify.post('/employees/:employeeId/reset-pin', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT'])
    }, platformSupport_controller_1.PlatformSupportController.resetPin);
};
exports.platformSupportRoutes = platformSupportRoutes;
