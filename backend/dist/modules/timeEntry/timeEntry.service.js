"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntryService = void 0;
const prisma_1 = require("../../utils/prisma");
const schedule_1 = require("../../utils/schedule");
class TimeEntryService {
    async clock(employeeId, data, ipAddress, deviceInfo) {
        // Get last entry to perform validations
        // We check the last entry regardless of the day to handle edge cases
        // where workers forgot to clock out (Cron job will flag these later)
        const lastEntry = await prisma_1.prisma.timeEntry.findFirst({
            where: { employeeId },
            orderBy: { timestamp: 'desc' }
        });
        const type = data.entryType;
        if (type === 'CLOCK_IN') {
            if (lastEntry && lastEntry.entryType !== 'CLOCK_OUT') {
                throw new Error('Already clocked in or on pause');
            }
        }
        else if (type === 'CLOCK_OUT') {
            if (!lastEntry || lastEntry.entryType === 'CLOCK_OUT') {
                throw new Error('Cannot clock out without an active clock in');
            }
            if (lastEntry.entryType === 'PAUSE_START') {
                throw new Error('Cannot clock out while on pause. End pause first.');
            }
        }
        else if (type === 'PAUSE_START') {
            if (!lastEntry || lastEntry.entryType === 'CLOCK_OUT') {
                throw new Error('Cannot start pause without an active clock in');
            }
            if (lastEntry.entryType === 'PAUSE_START') {
                throw new Error('Already on pause');
            }
        }
        else if (type === 'PAUSE_END') {
            if (!lastEntry || lastEntry.entryType !== 'PAUSE_START') {
                throw new Error('No active pause to end');
            }
        }
        const timestamp = new Date(); // Always UTC
        const newEntry = await prisma_1.prisma.timeEntry.create({
            data: {
                employeeId,
                entryType: type,
                timestamp,
                latitude: data.latitude,
                longitude: data.longitude,
                ipAddress,
                deviceInfo,
                source: 'REALTIME'
            }
        });
        // Check for missing GPS on CLOCK_IN and generate Incident
        if (type === 'CLOCK_IN' && (data.latitude == null || data.longitude == null)) {
            await prisma_1.prisma.incident.create({
                data: {
                    employeeId,
                    timeEntryId: newEntry.id,
                    date: timestamp,
                    description: 'Fichaje de entrada sin ubicación (GPS no disponible o denegado por el usuario).'
                }
            });
        }
        // Digital Disconnection Check
        if (type === 'CLOCK_IN' || type === 'CLOCK_OUT' || type === 'PAUSE_START' || type === 'PAUSE_END') {
            const employee = await prisma_1.prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
            if (employee) {
                const outside = await (0, schedule_1.isOutsideSchedule)(employeeId, employee.companyId, timestamp);
                if (outside) {
                    await (0, schedule_1.logDisconnectionViolation)(employeeId, `Fichaje fuera de horario laboral (${type})`, {
                        timeEntryId: newEntry.id,
                        timestamp,
                        type
                    });
                }
            }
        }
        return newEntry;
    }
    async getMyHistory(employeeId, from, to) {
        const whereClause = { employeeId };
        if (from || to) {
            whereClause.timestamp = {};
            if (from)
                whereClause.timestamp.gte = new Date(from);
            if (to)
                whereClause.timestamp.lte = new Date(to);
        }
        return await prisma_1.prisma.timeEntry.findMany({
            where: whereClause,
            orderBy: { timestamp: 'desc' }
        });
    }
    async getAllHistory(companyId, employeeId, from, to) {
        const whereClause = {
            employee: { companyId }
        };
        if (employeeId) {
            whereClause.employeeId = employeeId;
        }
        if (from || to) {
            whereClause.timestamp = {};
            if (from)
                whereClause.timestamp.gte = new Date(from);
            if (to)
                whereClause.timestamp.lte = new Date(to);
        }
        return await prisma_1.prisma.timeEntry.findMany({
            where: whereClause,
            include: { employee: { select: { name: true, identifier: true } } },
            orderBy: { timestamp: 'desc' },
            take: 1000 // Limit for safety
        });
    }
}
exports.TimeEntryService = TimeEntryService;
