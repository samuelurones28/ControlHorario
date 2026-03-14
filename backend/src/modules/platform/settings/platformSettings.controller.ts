import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../../utils/prisma'

export class PlatformSettingsController {

  static async getSettings(request: FastifyRequest, reply: FastifyReply) {
    const settings = await prisma.platformSetting.findMany({
      orderBy: { key: 'asc' }
    })

    // Convert from Array of objects to a Key-Value dictionary for easier frontend consumption
    const settingsMap = settings.reduce((acc, current) => {
      acc[current.key] = current.value
      return acc
    }, {} as Record<string, any>)

    return reply.send(settingsMap)
  }

  static async updateSetting(request: FastifyRequest<{ Params: { key: string }, Body: { value: any } }>, reply: FastifyReply) {
    const { key } = request.params
    const { value } = request.body
    const adminId = request.platformAdmin?.id

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      update: { value, updatedBy: adminId },
      create: { key, value, updatedBy: adminId }
    })

    return reply.send(setting)
  }
}
