import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from 'helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { ZodError } from 'zod';
import { config } from './config/env';
import { initCronJobs } from './jobs/cron';

export const buildServer = () => {
  const app = fastify({ logger: config.NODE_ENV === 'development' });

  // Middleware
  app.register(cors, {
    origin: config.NODE_ENV === 'development' ? true : config.CORS_ORIGIN,
    credentials: true,
  });

  app.register(rateLimit, {
    max: 100, // global default limit
    timeWindow: '1 minute',
  });

  app.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: {
      cookieName: 'refreshToken',
      signed: false, // simpler for this implementation
    },
  });

  app.register(cookie);

  app.register(helmet, {
    crossOriginResourcePolicy: false,
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // Frame busting
    frameguard: { action: 'deny' },
    // Disable MIME sniffing
    noSniff: true,
    // XSS protection
    xssFilter: true,
    // Referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });

  // Error Handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Validation error',
        details: error.errors,
      });
    }

    if ((error as any).statusCode === 429) {
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
      });
    }

    const statusCode = (error as any).statusCode;
    if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send({
        error: (error as any).message,
        message: (error as any).message,
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: config.NODE_ENV === 'development' ? (error as any).message : 'Something went wrong',
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
  app.register(require('./modules/audit/audit.routes').auditRoutes, { prefix: '/api/v1/audit-logs' });
  app.register(require('./modules/webauthn/webauthn.routes').webauthnRoutes, { prefix: '/api/v1' });

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
  initCronJobs();

  return app;
};

const start = async () => {
  const app = buildServer();
  try {
    const port = parseInt(config.PORT, 10);
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server listening on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}
