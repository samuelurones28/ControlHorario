"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformCompaniesRoutes = void 0;
const platformAuthenticate_1 = require("../../../middleware/platformAuthenticate");
const platformAuthorize_1 = require("../../../middleware/platformAuthorize");
const platformAuditLogger_1 = require("../../../middleware/platformAuditLogger");
const platformRateLimiter_1 = require("../../../middleware/platformRateLimiter");
const platformCompanies_controller_1 = require("./platformCompanies.controller");
const platformCompaniesRoutes = async (fastify) => {
    fastify.addHook('preValidation', platformAuthenticate_1.platformAuthenticate);
    fastify.addHook('onResponse', platformAuditLogger_1.platformAuditLogger);
    fastify.get('/', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
    }, platformCompanies_controller_1.PlatformCompaniesController.listCompanies);
    fastify.get('/:id', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT', 'VIEWER'])
    }, platformCompanies_controller_1.PlatformCompaniesController.getCompanyDetail);
    fastify.patch('/:id/status', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN'])
    }, platformCompanies_controller_1.PlatformCompaniesController.updateCompanyStatus);
    fastify.get('/:id/audit-log', {
        ...platformRateLimiter_1.platformStandardRateLimit,
        preHandler: (0, platformAuthorize_1.platformAuthorize)(['SUPER_ADMIN', 'SUPPORT'])
    }, platformCompanies_controller_1.PlatformCompaniesController.getCompanyAuditLog);
};
exports.platformCompaniesRoutes = platformCompaniesRoutes;
