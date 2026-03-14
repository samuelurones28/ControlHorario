"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const prisma_1 = require("../../utils/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
class EmployeeService {
    async listEmployees(companyId) {
        return await prisma_1.prisma.employee.findMany({
            where: { companyId },
            select: {
                id: true, name: true, identifier: true, role: true,
                contractType: true, weeklyHours: true, active: true, createdAt: true
            },
            orderBy: { name: 'asc' }
        });
    }
    async createEmployee(companyId, data) {
        const email = data.email && data.email.trim() !== '' ? data.email : null;
        // Auto-create or find existing global User identity
        const user = email
            ? await prisma_1.prisma.user.upsert({
                where: { email },
                create: { email },
                update: {} // do nothing if it already exists
            })
            : await prisma_1.prisma.user.create({ data: {} });
        // In employee normal login takes PIN randomly generated and 6 digits long.
        const pin = crypto_1.default.randomInt(100000, 999999).toString();
        const pinHash = await bcrypt_1.default.hash(pin, 12);
        const employee = await prisma_1.prisma.employee.create({
            data: {
                userId: user.id,
                companyId,
                name: data.name,
                identifier: data.identifier,
                role: data.role,
                contractType: data.contractType,
                weeklyHours: data.weeklyHours,
                pinHash
            }
        });
        return { ...employee, plainPin: pin };
    }
    async updateEmployee(employeeId, companyId, data) {
        const existing = await prisma_1.prisma.employee.findFirst({
            where: { id: employeeId, companyId }
        });
        if (!existing)
            throw new Error('Employee not found or unauthorized');
        return await prisma_1.prisma.employee.update({
            where: { id: employeeId },
            data,
            select: { id: true, name: true, identifier: true, role: true, active: true }
        });
    }
    async deleteEmployee(employeeId, companyId) {
        const existing = await prisma_1.prisma.employee.findFirst({
            where: { id: employeeId, companyId }
        });
        if (!existing)
            throw new Error('Employee not found or unauthorized');
        return await prisma_1.prisma.employee.update({
            where: { id: employeeId },
            data: { active: false },
            select: { id: true, name: true, active: true }
        });
    }
}
exports.EmployeeService = EmployeeService;
