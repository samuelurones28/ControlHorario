"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformMonitoringRoutes = void 0;
const platformAuthenticate_1 = require("../../../middleware/platformAuthenticate");
const platformAuthorize_1 = require("../../../middleware/platformAuthorize");
const platformRateLimiter_1 = require("../../../middleware/platformRateLimiter");
const platformMonitoring_controller_1 = require("./platformMonitoring.controller");
const platformMonitoringRoutes = async (fastify) => {
    fastify.addHook('preValidation', platformAuthenticate_1.platformAuthenticate);
    fastify.get('/jobs', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
    }, platformMonitoring_controller_1.PlatformMonitoringController.getJobsStatus);
    fastify.get('/errors', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
    }, platformMonitoring_controller_1.PlatformMonitoringController.getRecentErrors);
    fastify.get('/metrics', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
    }, platformMonitoring_controller_1.PlatformMonitoringController.getMetrics);
};
exports.platformMonitoringRoutes = platformMonitoringRoutes;
