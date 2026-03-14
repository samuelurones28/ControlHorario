"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeOpenEntriesJob = closeOpenEntriesJob;
exports.generateWeeklyReportsJob = generateWeeklyReportsJob;
exports.initCronJobs = initCronJobs;
const prisma_1 = require("../utils/prisma");
const date_fns_1 = require("date-fns");
const node_cron_1 = __importDefault(require("node-cron"));
const timeCalculation_service_1 = require("../services/timeCalculation.service");
const timeCalcService = new timeCalculation_service_1.TimeCalculationService();
async function closeOpenEntriesJob() {
    const yesterday = (0, date_fns_1.subDays)(new Date(), 1);
    const start = (0, date_fns_1.startOfDay)(yesterday);
    const end = (0, date_fns_1.endOfDay)(yesterday);
    console.log(`Running open entries check for ${start.toISOString()} to ${end.toISOString()}`);
    const employees = await prisma_1.prisma.employee.findMany();
    for (const emp of employees) {
        const lastEntry = await prisma_1.prisma.timeEntry.findFirst({
            where: { employeeId: emp.id, timestamp: { gte: start, lte: end } },
            orderBy: { timestamp: 'desc' }
        });
        if (lastEntry && (lastEntry.entryType === 'CLOCK_IN' || lastEntry.entryType === 'PAUSE_START' || lastEntry.entryType === 'PAUSE_END')) {
            await prisma_1.prisma.incident.create({
                data: {
                    timeEntryId: lastEntry.id,
                    employeeId: emp.id,
                    date: lastEntry.timestamp,
                    description: 'INCIDENCIA SISTEMA: Fichaje no cerrado al terminar el día.',
                    status: 'OPEN'
                }
            });
            console.log(`Created incident for employee ${emp.id}`);
        }
    }
}
async function generateWeeklyReportsJob() {
    const today = new Date();
    // Calculate previous week (Monday to Sunday)
    const lastSunday = (0, date_fns_1.subDays)(today, today.getDay() === 0 ? 7 : today.getDay());
    const lastMonday = (0, date_fns_1.subDays)(lastSunday, 6);
    const weekStart = (0, date_fns_1.startOfDay)(lastMonday);
    const weekEnd = (0, date_fns_1.endOfDay)(lastSunday);
    console.log(`Generating weekly reports for ${weekStart.toISOString()} - ${weekEnd.toISOString()}`);
    const employees = await prisma_1.prisma.employee.findMany({ where: { active: true } });
    for (const emp of employees) {
        const weeklyCalc = await timeCalcService.calculateWeeklyHours(emp.id, weekStart);
        // Generate snapshot data
        const dailyData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            const dayRecord = await timeCalcService.calculateDailyRecord(emp.id, d, emp.weeklyHours);
            let firstIn = null, lastOut = null;
            const entries = await prisma_1.prisma.timeEntry.findMany({
                where: { employeeId: emp.id, timestamp: { gte: (0, date_fns_1.startOfDay)(d), lte: (0, date_fns_1.endOfDay)(d) } },
                orderBy: { timestamp: 'asc' }
            });
            if (entries.length > 0) {
                firstIn = entries.find(e => e.entryType === 'CLOCK_IN')?.timestamp.toISOString() || null;
                lastOut = entries.reverse().find(e => e.entryType === 'CLOCK_OUT')?.timestamp.toISOString() || null;
            }
            dailyData.push({
                date: d.toISOString().split('T')[0],
                netWorked: dayRecord.netWorked,
                totalPaused: dayRecord.totalPaused,
                overtime: dayRecord.overtime,
                firstIn,
                lastOut
            });
        }
        await prisma_1.prisma.weeklyReport.create({
            data: {
                employeeId: emp.id,
                companyId: emp.companyId,
                weekStart,
                weekEnd,
                totalWorked: weeklyCalc.totalWorked,
                totalPaused: dailyData.reduce((acc, curr) => acc + curr.totalPaused, 0),
                overtime: weeklyCalc.overtime,
                data: dailyData,
                status: 'PENDING_REVIEW'
            }
        });
        console.log(`Weekly report generated for employee ${emp.id}`);
    }
}
function initCronJobs() {
    console.log('Initializing Cron Jobs...');
    // Every day at 23:55
    node_cron_1.default.schedule('55 23 * * *', async () => {
        try {
            await closeOpenEntriesJob();
        }
        catch (e) {
            console.error('Error running closeOpenEntriesJob:', e);
        }
    });
    // Every Monday at 06:00
    node_cron_1.default.schedule('0 6 * * 1', async () => {
        try {
            await generateWeeklyReportsJob();
        }
        catch (e) {
            console.error('Error running generateWeeklyReportsJob:', e);
        }
    });
}
