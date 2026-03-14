"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeCalculationService = void 0;
const prisma_1 = require("../utils/prisma");
const date_fns_1 = require("date-fns");
class TimeCalculationService {
    async getEffectiveEntries(employeeId, from, to) {
        const entries = await prisma_1.prisma.timeEntry.findMany({
            where: {
                employeeId,
                timestamp: { gte: from, lte: to }
            },
            include: {
                amendments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { timestamp: 'asc' }
        });
        return entries.map(entry => {
            const effectiveTimestamp = entry.amendments.length > 0 ? entry.amendments[0].newTimestamp : entry.timestamp;
            return { ...entry, effectiveTimestamp };
        }).sort((a, b) => a.effectiveTimestamp.getTime() - b.effectiveTimestamp.getTime());
    }
    async calculateDailyRecord(employeeId, date, employeeHours) {
        if (!employeeHours) {
            const emp = await prisma_1.prisma.employee.findUnique({ where: { id: employeeId } });
            employeeHours = emp?.weeklyHours || 40;
        }
        const from = (0, date_fns_1.startOfDay)(date);
        const to = (0, date_fns_1.endOfDay)(date);
        // Verificar si hay ausencia justificada
        const absence = await prisma_1.prisma.absenceRequest.findFirst({
            where: {
                employeeId,
                status: 'APPROVED',
                startDate: { lte: to },
                endDate: { gte: from }
            }
        });
        if (absence) {
            const dailyTarget = (employeeHours / 5) * 3600000;
            return {
                totalWorked: dailyTarget,
                totalPaused: 0,
                netWorked: dailyTarget,
                overtime: 0,
                isAbsence: true,
                absenceType: absence.type
            };
        }
        const entries = await this.getEffectiveEntries(employeeId, from, to);
        let totalWorked = 0;
        let totalPaused = 0;
        let lastClockIn = null;
        let lastPauseStart = null;
        for (const entry of entries) {
            if (entry.entryType === 'CLOCK_IN') {
                lastClockIn = entry.effectiveTimestamp;
            }
            else if (entry.entryType === 'CLOCK_OUT') {
                if (lastClockIn) {
                    totalWorked += (0, date_fns_1.differenceInMilliseconds)(entry.effectiveTimestamp, lastClockIn);
                    lastClockIn = null;
                }
            }
            else if (entry.entryType === 'PAUSE_START') {
                lastPauseStart = entry.effectiveTimestamp;
                if (lastClockIn) {
                    totalWorked += (0, date_fns_1.differenceInMilliseconds)(entry.effectiveTimestamp, lastClockIn);
                    lastClockIn = null;
                }
            }
            else if (entry.entryType === 'PAUSE_END') {
                if (lastPauseStart) {
                    totalPaused += (0, date_fns_1.differenceInMilliseconds)(entry.effectiveTimestamp, lastPauseStart);
                    lastPauseStart = null;
                }
                lastClockIn = entry.effectiveTimestamp;
            }
        }
        const netWorked = totalWorked;
        const dailyTarget = (employeeHours / 5) * 3600000;
        const overtime = Math.max(0, netWorked - dailyTarget);
        return { totalWorked, totalPaused, netWorked, overtime, isAbsence: false, absenceType: null };
    }
    async calculateWeeklyHours(employeeId, weekStart) {
        const emp = await prisma_1.prisma.employee.findUnique({ where: { id: employeeId } });
        const contractHours = emp?.weeklyHours || 40;
        let totalNetWorked = 0;
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            const daily = await this.calculateDailyRecord(employeeId, day, contractHours);
            totalNetWorked += daily.netWorked;
        }
        const contractMs = contractHours * 3600000;
        const overtime = Math.max(0, totalNetWorked - contractMs);
        const undertime = Math.max(0, contractMs - totalNetWorked);
        return { totalWorked: totalNetWorked, contractHours, overtime, undertime };
    }
    async calculateMonthlyReport(employeeId, month, year) {
        const emp = await prisma_1.prisma.employee.findUnique({ where: { id: employeeId } });
        const start = new Date(Date.UTC(year, month - 1, 1));
        const totalDays = (0, date_fns_1.endOfMonth)(start).getDate();
        let totalWorked = 0;
        let totalPaused = 0;
        let totalOvertime = 0;
        let daysWorked = 0;
        for (let i = 1; i <= totalDays; i++) {
            const day = new Date(Date.UTC(year, month - 1, i));
            const daily = await this.calculateDailyRecord(employeeId, day, emp?.weeklyHours);
            if (daily.netWorked > 0) {
                daysWorked++;
                totalWorked += daily.netWorked;
                totalPaused += daily.totalPaused;
                totalOvertime += daily.overtime;
            }
        }
        return { daysWorked, totalWorked, totalPaused, totalOvertime };
    }
}
exports.TimeCalculationService = TimeCalculationService;
