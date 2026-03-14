"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../../utils/prisma");
const nanoid_1 = require("nanoid");
const generateCompanyCode = (0, nanoid_1.customAlphabet)('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
class AuthService {
    async registerCompany(data) {
        const existingCompany = await prisma_1.prisma.company.findUnique({
            where: { cif: data.cif }
        });
        if (existingCompany) {
            throw new Error('Company with this CIF already exists');
        }
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: data.adminEmail }
        });
        if (existingUser) {
            throw new Error('Email is already in use by a User');
        }
        const hashedPassword = await bcrypt_1.default.hash(data.adminPassword, 12);
        const companyCode = generateCompanyCode();
        return await prisma_1.prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    code: companyCode,
                    name: data.companyName,
                    cif: data.cif,
                    address: data.address
                }
            });
            const user = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    passwordHash: hashedPassword
                }
            });
            const admin = await tx.employee.create({
                data: {
                    userId: user.id,
                    companyId: company.id,
                    name: data.adminName,
                    identifier: data.adminEmail, // Reusing email as unique identifier inside this company context
                    role: 'ADMIN'
                }
            });
            return { company, user, admin };
        });
    }
    async adminLogin(data) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: data.email },
            include: {
                employees: {
                    include: { company: true }
                }
            }
        });
        if (!user || !data.password) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            throw err;
        }
        if (!user.passwordHash) {
            const err = new Error('Admin login is not enabled for this user');
            err.statusCode = 401;
            throw err;
        }
        const isValid = await bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!isValid) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            throw err;
        }
        // Defaulting to first company context for MVP
        if (user.employees.length === 0) {
            throw new Error('No company assigned to this admin');
        }
        const adminProfile = user.employees.find(e => e.role === 'ADMIN') || user.employees[0];
        return { user, activeEmployee: adminProfile };
    }
    async employeeLogin(data) {
        const company = await prisma_1.prisma.company.findUnique({
            where: { code: data.companyCode }
        });
        if (!company) {
            throw new Error('Company code not found');
        }
        const employee = await prisma_1.prisma.employee.findUnique({
            where: {
                identifier_companyId: {
                    identifier: data.identifier,
                    companyId: company.id
                }
            },
            include: { user: true, company: true }
        });
        if (!employee || !employee.active || !employee.pinHash) {
            throw new Error('Invalid credentials or inactive account');
        }
        const isValid = await bcrypt_1.default.compare(data.pin, employee.pinHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        return employee;
    }
}
exports.AuthService = AuthService;
