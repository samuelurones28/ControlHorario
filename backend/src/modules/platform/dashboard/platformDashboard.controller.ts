import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../utils/prisma'

export class PlatformDashboardController {

  static async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const today = new Date()
    today.setHours(0,0,0,0)

    const [totalCompanies, totalEmployees, todayClockIns] = await Promise.all([
      prisma.company.count(),
      prisma.employee.count(),
      prisma.timeEntry.count({
        where: {
          timestamp: { gte: today },
          entryType: 'CLOCK_IN'
        }
      })
    ])

    // Assume all are active since we don't have the `active` flag on company yet
    const activeCompanies = totalCompanies
    
    const activeEmployees = await prisma.employee.count({
      where: { active: true }
    })

    // Simulated system health. In a real system, we'd query pg_stat or use an APM
    const systemHealth = {
      database: "ok",
      diskUsage: { used: "45GB", total: "100GB", percent: 45 },
      backupLastRun: new Date(), // Mocked
      backupStatus: "ok",
      apiResponseAvg: 112 // Mocked ms
    }

    // Recent critical alerts from audit logs or specific error table (if existed)
    // We will just fetch recent actions by SUPER_ADMINs that might be interesting
    const recentAlerts = await prisma.platformAuditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    return reply.send({
      totalCompanies,
      activeCompanies,
      totalEmployees,
      activeEmployees,
      todayClockIns,
      systemHealth,
      recentAlerts
    })
  }
}
