import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../utils/prisma'

export class PlatformHolidaysController {

  static async getHolidays(request: FastifyRequest<{ Querystring: { year?: number; region?: string } }>, reply: FastifyReply) {
    const { year, region } = request.query
    
    const where: any = {}

    if (year) {
      const startOfYear = new Date(`${year}-01-01T00:00:00Z`)
      const endOfYear = new Date(`${year}-12-31T23:59:59Z`)
      where.date = { gte: startOfYear, lte: endOfYear }
    }

    if (region) {
      where.region = region
    }

    const holidays = await prisma.nationalHoliday.findMany({
      where,
      orderBy: { date: 'asc' }
    })

    return reply.send(holidays)
  }

  static async createHoliday(request: FastifyRequest<{ Body: { date: string; name: string; region: string } }>, reply: FastifyReply) {
    const { date, name, region } = request.body

    try {
      const holiday = await prisma.nationalHoliday.create({
        data: {
          date: new Date(date),
          name,
          region
        }
      })
      return reply.code(201).send(holiday)
    } catch (e: any) {
      if (e.code === 'P2002') {
        return reply.code(400).send({ error: 'Ya existe un festivo en esa fecha y región' })
      }
      throw e
    }
  }

  static async updateHoliday(request: FastifyRequest<{ Params: { id: string }, Body: { name?: string; region?: string } }>, reply: FastifyReply) {
    const { id } = request.params
    const { name, region } = request.body

    const holiday = await prisma.nationalHoliday.update({
      where: { id },
      data: { name, region }
    })

    return reply.send(holiday)
  }

  static async deleteHoliday(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params

    await prisma.nationalHoliday.delete({
      where: { id }
    })

    return reply.send({ success: true })
  }
}
