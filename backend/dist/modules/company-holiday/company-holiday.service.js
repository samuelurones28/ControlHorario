"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyHolidayService = void 0;
const prisma_1 = require("../../utils/prisma");
class CompanyHolidayService {
    async setCompanyHolidays(companyId, holidays) {
        // We override the holidays for the current year or we just append. Let's just create multiple bypassing existing dates
        const dataToInsert = holidays.map(h => {
            const d = new Date(h.date);
            d.setUTCHours(0, 0, 0, 0);
            return { companyId, date: d, name: h.name };
        });
        // Delete existing holidays for the dates we are inserting? Or just clear all from that year?
        // Using Prisma nested create or createMany with skipDuplicates.
        return await prisma_1.prisma.holiday.createMany({
            data: dataToInsert,
            skipDuplicates: true
        });
    }
    async listCompanyHolidays(companyId) {
        return await prisma_1.prisma.holiday.findMany({
            where: { companyId },
            orderBy: { date: 'asc' }
        });
    }
    async deleteHoliday(companyId, id) {
        return await prisma_1.prisma.holiday.deleteMany({
            where: { id, companyId }
        });
    }
}
exports.CompanyHolidayService = CompanyHolidayService;
