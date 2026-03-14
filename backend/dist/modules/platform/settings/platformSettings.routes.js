"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformSettingsRoutes = void 0;
const platformAuthenticate_1 = require("../../../middleware/platformAuthenticate");
const platformAuthorize_1 = require("../../../middleware/platformAuthorize");
const platformAuditLogger_1 = require("../../../middleware/platformAuditLogger");
const platformRateLimiter_1 = require("../../../middleware/platformRateLimiter");
const platformSettings_controller_1 = require("./platformSettings.controller");
const platformSettingsRoutes = async (fastify) => {
    fastify.addHook('preValidation', platformAuthenticate_1.platformAuthenticate);
    fastify.addHook('onResponse', platformAuditLogger_1.platformAuditLogger);
    fastify.get('/', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
    }, platformSettings_controller_1.PlatformSettingsController.getSettings);
    fastify.patch('/:key', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformSettings_controller_1.PlatformSettingsController.updateSetting);
};
exports.platformSettingsRoutes = platformSettingsRoutes;
