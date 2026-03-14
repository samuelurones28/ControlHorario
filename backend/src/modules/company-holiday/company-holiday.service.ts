import { prisma } from '../../utils/prisma';
import { CreateHolidaysDto } from './company-holiday.schema';

export class CompanyHolidayService {
  async setCompanyHolidays(companyId: string, holidays: CreateHolidaysDto) {
    // We override the holidays for the current year or we just append. Let's just create multiple bypassing existing dates
    const dataToInsert = holidays.map(h => {
        const d = new Date(h.date);
        d.setUTCHours(0,0,0,0);
        return { companyId, date: d, name: h.name };
    });

    // Delete existing holidays for the dates we are inserting? Or just clear all from that year?
    // Using Prisma nested create or createMany with skipDuplicates.
    return await prisma.holiday.createMany({
        data: dataToInsert,
        skipDuplicates: true
    });
  }

  async listCompanyHolidays(companyId: string) {
    return await prisma.holiday.findMany({
      where: { companyId },
      orderBy: { date: 'asc' }
    });
  }

  async deleteHoliday(companyId: string, id: string) {
    return await prisma.holiday.deleteMany({
      where: { id, companyId }
    });
  }
}
