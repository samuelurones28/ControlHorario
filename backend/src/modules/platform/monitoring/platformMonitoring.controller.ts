import { FastifyReply, FastifyRequest } from 'fastify'

export class PlatformMonitoringController {

  static async getJobsStatus(request: FastifyRequest, reply: FastifyReply) {
    // In a real system, we'd query bullmq, pg-boss or internal node schedulers state
    const mockJobs = [
      { id: 'weeklyReportGenerator', lastRunAt: new Date(), status: 'completed', errors: 0 },
      { id: 'nightlyIncidentDetector', lastRunAt: new Date(Date.now() - 86400000), status: 'completed', errors: 0 },
      { id: 'backupJob', lastRunAt: new Date(Date.now() - 3600000), size: '240MB', status: 'completed', errors: 0 },
      { id: 'alertNotifier', lastRunAt: new Date(), status: 'running', errors: 0 }
    ]

    return reply.send(mockJobs)
  }

  static async getRecentErrors(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    // const { from, to, severity } = request.query
    // MOCK data representing a structured error logging output
    
    return reply.send([
      { id: 'err-1', type: 'UncaughtException', message: 'Unable to connect to Redis', severity: 'critical', count: 12, lastSeen: new Date() },
      { id: 'err-2', type: 'DatabaseTimeout', message: 'Query took longer than 5000ms', severity: 'warning', count: 4, lastSeen: new Date() },
      { id: 'err-3', type: 'AuthFailed', message: 'Invalid token format', severity: 'info', count: 240, lastSeen: new Date() }
    ])
  }

  static async getMetrics(request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) {
    // MOCK data. Usually polled from Prometheus / Cloudwatch
    return reply.send({
      timeEntriesPerDay: [
        { date: '2026-02-15', value: 450 },
        { date: '2026-02-16', value: 480 },
        { date: '2026-02-17', value: 420 },
        { date: '2026-02-18', value: 512 }
      ],
      activeCompaniesPerDay: [
        { date: '2026-02-15', value: 12 },
        { date: '2026-02-16', value: 12 },
        { date: '2026-02-17', value: 13 },
        { date: '2026-02-18', value: 13 }
      ],
      apiResponseTime: { p50: 89, p95: 145, p99: 310 }, // ms
      errorRate: 0.005 // 0.5%
    })
  }
}
