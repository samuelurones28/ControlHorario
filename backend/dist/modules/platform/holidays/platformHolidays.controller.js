"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformHolidaysController = void 0;
const prisma_1 = require("../../../utils/prisma");
class PlatformHolidaysController {
    static async getHolidays(request, reply) {
        const { year, region } = request.query;
        const where = {};
        if (year) {
            const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
            const endOfYear = new Date(`${year}-12-31T23:59:59Z`);
            where.date = { gte: startOfYear, lte: endOfYear };
        }
        if (region) {
            where.region = region;
        }
        const holidays = await prisma_1.prisma.nationalHoliday.findMany({
            where,
            orderBy: { date: 'asc' }
        });
        return reply.send(holidays);
    }
    static async createHoliday(request, reply) {
        const { date, name, region } = request.body;
        try {
            const holiday = await prisma_1.prisma.nationalHoliday.create({
                data: {
                    date: new Date(date),
                    name,
                    region
                }
            });
            return reply.code(201).send(holiday);
        }
        catch (e) {
            if (e.code === 'P2002') {
                return reply.code(400).send({ error: 'Ya existe un festivo en esa fecha y región' });
            }
            throw e;
        }
    }
    static async updateHoliday(request, reply) {
        const { id } = request.params;
        const { name, region } = request.body;
        const holiday = await prisma_1.prisma.nationalHoliday.update({
            where: { id },
            data: { name, region }
        });
        return reply.send(holiday);
    }
    static async deleteHoliday(request, reply) {
        const { id } = request.params;
        await prisma_1.prisma.nationalHoliday.delete({
            where: { id }
        });
        return reply.send({ success: true });
    }
}
exports.PlatformHolidaysController = PlatformHolidaysController;
