"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const zod_1 = require("zod");
const env_1 = require("./config/env");
const cron_1 = require("./jobs/cron");
const buildServer = () => {
    const app = (0, fastify_1.default)({ logger: env_1.config.NODE_ENV === 'development' });
    // Middleware
    app.register(cors_1.default, {
        origin: env_1.config.CORS_ORIGIN,
        credentials: true,
    });
    app.register(rate_limit_1.default, {
        max: 100, // global default limit
        timeWindow: '1 minute',
    });
    app.register(jwt_1.default, {
        secret: env_1.config.JWT_SECRET,
        cookie: {
            cookieName: 'refreshToken',
            signed: false, // simpler for this implementation
        },
    });
    app.register(cookie_1.default);
    // app.register(helmet); // Disable helmet for now or configure carefully to avoid breaking things
    // Error Handler
    app.setErrorHandler((error, request, reply) => {
        if (error instanceof zod_1.ZodError) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Validation error',
                details: error.errors,
            });
        }
        if (error.statusCode === 429) {
            return reply.status(429).send({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded',
            });
        }
        const statusCode = error.statusCode;
        if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
            return reply.status(statusCode).send({
                error: error.message,
                message: error.message,
            });
        }
        request.log.error(error);
        return reply.status(500).send({
            error: 'Internal Server Error',
            message: env_1.config.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        });
    });
    // Health check
    app.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
    // Routes
    app.register(require('./modules/auth/auth.routes').authRoutes, { prefix: '/api/v1/auth' });
    app.register(require('./modules/timeEntry/timeEntry.routes').timeEntryRoutes, { prefix: '/api/v1/time-entries' });
    app.register(require('./modules/amendment/amendment.routes').amendmentRoutes, { prefix: '/api/v1/time-entries/amendments' });
    app.register(require('./modules/employee/employee.routes').employeeRoutes, { prefix: '/api/v1/employees' });
    app.register(require('./modules/incident/incident.routes').incidentRoutes, { prefix: '/api/v1/incidents' });
    app.register(require('./modules/weeklyReport/weeklyReport.routes').weeklyReportRoutes, { prefix: '/api/v1/weekly-reports' });
    app.register(require('./modules/report/report.routes').reportRoutes, { prefix: '/api/v1/reports' });
    app.register(require('./modules/privacy/privacy.routes').privacyRoutes, { prefix: '/api/v1/privacy' });
    app.register(require('./modules/schedule/schedule.routes').scheduleRoutes, { prefix: '/api/v1/schedules' });
    app.register(require('./modules/protocol/protocol.routes').protocolRoutes, { prefix: '/api/v1/protocol' });
    app.register(require('./modules/absence/absence.routes').absenceRoutes, { prefix: '/api/v1/absences' });
    app.register(require('./modules/company-holiday/company-holiday.routes').companyHolidayRoutes, { prefix: '/api/v1/holidays' });
    // --- Platform Admin Routes ---
    app.register(require('./modules/platform/auth/platformAuth.routes').platformAuthRoutes, { prefix: '/api/v1/platform/auth' });
    app.register(require('./modules/platform/companies/platformCompanies.routes').platformCompaniesRoutes, { prefix: '/api/v1/platform/companies' });
    app.register(require('./modules/platform/dashboard/platformDashboard.routes').platformDashboardRoutes, { prefix: '/api/v1/platform/dashboard' });
    app.register(require('./modules/platform/support/platformSupport.routes').platformSupportRoutes, { prefix: '/api/v1/platform/support' });
    app.register(require('./modules/platform/holidays/platformHolidays.routes').platformHolidaysRoutes, { prefix: '/api/v1/platform/holidays' });
    app.register(require('./modules/platform/settings/platformSettings.routes').platformSettingsRoutes, { prefix: '/api/v1/platform/settings' });
    app.register(require('./modules/platform/admins/platformAdmins.routes').platformAdminsRoutes, { prefix: '/api/v1/platform/admins' });
    app.register(require('./modules/platform/monitoring/platformMonitoring.routes').platformMonitoringRoutes, { prefix: '/api/v1/platform/monitoring' });
    // Initialize background jobs
    (0, cron_1.initCronJobs)();
    return app;
};
exports.buildServer = buildServer;
const start = async () => {
    const app = (0, exports.buildServer)();
    try {
        const port = parseInt(env_1.config.PORT, 10);
        await app.listen({ port, host: '0.0.0.0' });
        app.log.info(`Server listening on http://localhost:${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
if (require.main === module) {
    start();
}
