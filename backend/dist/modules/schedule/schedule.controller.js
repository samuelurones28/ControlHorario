"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchedules = exports.getCompanySchedules = exports.getMySchedule = void 0;
const prisma_1 = require("../../utils/prisma");
const getMySchedule = async (req, reply) => {
    const user = req.user;
    // Get employee specific
    const employeeSchedules = await prisma_1.prisma.schedule.findMany({
        where: { employeeId: user.employeeId }
    });
    // Get company default
    const companySchedules = await prisma_1.prisma.schedule.findMany({
        where: { companyId: user.companyId, employeeId: null }
    });
    return reply.send({
        employee: employeeSchedules,
        company: companySchedules
    });
};
exports.getMySchedule = getMySchedule;
const getCompanySchedules = async (req, reply) => {
    const user = req.user;
    const schedules = await prisma_1.prisma.schedule.findMany({
        where: { companyId: user.companyId }
    });
    return reply.send(schedules);
};
exports.getCompanySchedules = getCompanySchedules;
const updateSchedules = async (req, reply) => {
    const user = req.user;
    const { schedules } = req.body;
    // We delete the existing ones for the given target (employee or company) and recreate them
    // A bit brute force but robust for 7 items max per entity
    const byEmployee = schedules.filter(s => s.employeeId);
    const byCompany = schedules.filter(s => !s.employeeId);
    await prisma_1.prisma.$transaction(async (tx) => {
        if (byCompany.length > 0) {
            await tx.schedule.deleteMany({
                where: { companyId: user.companyId, employeeId: null }
            });
            await tx.schedule.createMany({
                data: byCompany.map(s => ({
                    companyId: user.companyId,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isWorkDay: s.isWorkDay
                }))
            });
        }
        // Group by employee to delete and replace
        const employeeIds = [...new Set(byEmployee.map(s => s.employeeId))];
        for (const empId of employeeIds) {
            const empSchedules = byEmployee.filter(s => s.employeeId === empId);
            await tx.schedule.deleteMany({
                where: { companyId: user.companyId, employeeId: empId }
            });
            await tx.schedule.createMany({
                data: empSchedules.map(s => ({
                    companyId: user.companyId,
                    employeeId: empId,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isWorkDay: s.isWorkDay
                }))
            });
        }
    });
    return reply.send({ success: true });
};
exports.updateSchedules = updateSchedules;
