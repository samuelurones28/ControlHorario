"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const prisma_1 = require("../../utils/prisma");
const timeCalculation_service_1 = require("../../services/timeCalculation.service");
const date_fns_1 = require("date-fns");
const timeCalcService = new timeCalculation_service_1.TimeCalculationService();
class ReportService {
    async getDailyReport(companyId, dateStr) {
        const targetDate = new Date(dateStr);
        const employees = await prisma_1.prisma.employee.findMany({
            where: { companyId, active: true }
        });
        const report = [];
        for (const emp of employees) {
            const daily = await timeCalcService.calculateDailyRecord(emp.id, targetDate, emp.weeklyHours);
            const lastEntry = await prisma_1.prisma.timeEntry.findFirst({
                where: { employeeId: emp.id, timestamp: { gte: (0, date_fns_1.startOfDay)(targetDate), lte: (0, date_fns_1.endOfDay)(targetDate) } },
                include: { amendments: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });
            let status = 'NO_FICHADO';
            if (daily.isAbsence) {
                status = 'AUSENCIA';
            }
            else if (lastEntry) {
                if (lastEntry.entryType === 'CLOCK_IN' || lastEntry.entryType === 'PAUSE_END')
                    status = 'FICHADO';
                else if (lastEntry.entryType === 'CLOCK_OUT')
                    status = 'SALIO';
                else if (lastEntry.entryType === 'PAUSE_START')
                    status = 'EN_PAUSA';
            }
            report.push({
                employee: { id: emp.id, name: emp.name, identifier: emp.identifier },
                status,
                ...daily
            });
        }
        return report;
    }
    async exportCsv(companyId, fromStr, toStr) {
        const from = new Date(fromStr);
        const to = new Date(toStr);
        const employees = await prisma_1.prisma.employee.findMany({
            where: { companyId }
        });
        // CSV Headers requested: Empleado, Fecha, Entrada, Salida, Pausas, Total Horas, Tipo Horas
        let csv = 'Empleado,Fecha,Entrada,Salida,Pausas(ms),Total Horas(ms),Tipo Horas\n';
        for (const emp of employees) {
            for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                const daily = await timeCalcService.calculateDailyRecord(emp.id, d, emp.weeklyHours);
                if (daily.netWorked > 0 || daily.isAbsence) {
                    const formattedDate = d.toISOString().split('T')[0];
                    let typeHours = daily.overtime > 0 ? 'Con Extra' : 'Normal';
                    let entrada = '';
                    let salida = '';
                    if (daily.isAbsence) {
                        typeHours = daily.absenceType || 'JUSTIFICADO';
                        entrada = '-';
                        salida = '-';
                    }
                    else {
                        const entries = await prisma_1.prisma.timeEntry.findMany({
                            where: { employeeId: emp.id, timestamp: { gte: (0, date_fns_1.startOfDay)(d), lte: (0, date_fns_1.endOfDay)(d) } },
                            orderBy: { timestamp: 'asc' }
                        });
                        entrada = entries.find(e => e.entryType === 'CLOCK_IN')?.timestamp.toISOString() || '';
                        salida = entries.reverse().find(e => e.entryType === 'CLOCK_OUT')?.timestamp.toISOString() || '';
                    }
                    csv += `"${emp.name}",${formattedDate},${entrada},${salida},${daily.totalPaused},${daily.netWorked},"${typeHours}"\n`;
                }
            }
        }
        return csv;
    }
}
exports.ReportService = ReportService;
