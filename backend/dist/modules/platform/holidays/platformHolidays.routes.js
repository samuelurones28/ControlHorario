"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformHolidaysRoutes = void 0;
const platformAuthenticate_1 = require("../../../middleware/platformAuthenticate");
const platformAuthorize_1 = require("../../../middleware/platformAuthorize");
const platformAuditLogger_1 = require("../../../middleware/platformAuditLogger");
const platformRateLimiter_1 = require("../../../middleware/platformRateLimiter");
const platformHolidays_controller_1 = require("./platformHolidays.controller");
const platformHolidaysRoutes = async (fastify) => {
    fastify.addHook('preValidation', platformAuthenticate_1.platformAuthenticate);
    fastify.addHook('onResponse', platformAuditLogger_1.platformAuditLogger);
    fastify.get('/', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
    }, platformHolidays_controller_1.PlatformHolidaysController.getHolidays);
    fastify.post('/', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformHolidays_controller_1.PlatformHolidaysController.createHoliday);
    fastify.put('/:id', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformHolidays_controller_1.PlatformHolidaysController.updateHoliday);
    fastify.delete('/:id', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformHolidays_controller_1.PlatformHolidaysController.deleteHoliday);
};
exports.platformHolidaysRoutes = platformHolidaysRoutes;
