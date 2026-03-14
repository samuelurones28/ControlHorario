"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformAuthRoutes = void 0;
const platformAuth_controller_1 = require("./platformAuth.controller");
const platformRateLimiter_1 = require("../../../middleware/platformRateLimiter");
const platformAuthRoutes = async (fastify) => {
    fastify.post('/login', {
        ...platformRateLimiter_1.platformLoginRateLimit,
    }, platformAuth_controller_1.PlatformAuthController.login);
    fastify.post('/login/verify-totp', {
        ...platformRateLimiter_1.platformLoginRateLimit,
    }, platformAuth_controller_1.PlatformAuthController.verifyTotp);
    fastify.post('/login/setup-totp', {
        ...platformRateLimiter_1.platformStandardRateLimit,
    }, platformAuth_controller_1.PlatformAuthController.setupTotp);
    fastify.post('/login/verify-recovery', {
        ...platformRateLimiter_1.platformLoginRateLimit,
    }, platformAuth_controller_1.PlatformAuthController.verifyRecoveryCode);
    fastify.post('/refresh', {
        ...platformRateLimiter_1.platformStandardRateLimit,
    }, platformAuth_controller_1.PlatformAuthController.refresh);
    fastify.post('/logout', {
        ...platformRateLimiter_1.platformStandardRateLimit,
    }, platformAuth_controller_1.PlatformAuthController.logout);
};
exports.platformAuthRoutes = platformAuthRoutes;
