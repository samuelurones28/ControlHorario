"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformDashboardRoutes = void 0;
const platformAuthenticate_1 = require("../../../middleware/platformAuthenticate");
const platformAuthorize_1 = require("../../../middleware/platformAuthorize");
const platformRateLimiter_1 = require("../../../middleware/platformRateLimiter");
const platformDashboard_controller_1 = require("./platformDashboard.controller");
const platformDashboardRoutes = async (fastify) => {
    // Apply platform middlewares to all routes in this plugin
    fastify.addHook('preValidation', platformAuthenticate_1.platformAuthenticate);
    fastify.get('/', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
    }, platformDashboard_controller_1.PlatformDashboardController.getDashboard);
};
exports.platformDashboardRoutes = platformDashboardRoutes;
