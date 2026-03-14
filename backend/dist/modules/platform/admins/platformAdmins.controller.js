"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAdminsController = void 0;
const prisma_1 = require("../../../utils/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PlatformAdminsController {
    static async getAdmins(request, reply) {
        const admins = await prisma_1.prisma.platformAdmin.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                lastLoginAt: true,
                createdAt: true,
                totpSecret: true // Not returning secret, just resolving boolean below
            },
            orderBy: { createdAt: 'desc' }
        });
        return reply.send(admins.map(a => ({
            ...a,
            has2FA: !!a.totpSecret,
            totpSecret: undefined
        })));
    }
    static async createAdmin(request, reply) {
        const { email, name, role, password } = request.body;
        const existingUser = await prisma_1.prisma.platformAdmin.findUnique({ where: { email } });
        if (existingUser) {
            return reply.code(400).send({ error: 'El email ya está en uso' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const admin = await prisma_1.prisma.platformAdmin.create({
            data: {
                email,
                name,
                role,
                passwordHash,
                active: true
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                createdAt: true
            }
        });
        return reply.code(201).send(admin);
    }
    static async updateAdmin(request, reply) {
        const { id } = request.params;
        const { role, active } = request.body;
        const adminToUpdate = await prisma_1.prisma.platformAdmin.findUnique({ where: { id } });
        if (!adminToUpdate)
            return reply.code(404).send({ error: 'Admin no encontrado' });
        // Check if trying to deactivate the last active super admin
        if (active === false && adminToUpdate.role === 'SUPER_ADMIN') {
            const activeSuperAdmins = await prisma_1.prisma.platformAdmin.count({
                where: { role: 'SUPER_ADMIN', active: true }
            });
            if (activeSuperAdmins <= 1) {
                return reply.code(400).send({ error: 'No puedes desactivar al último SUPER_ADMIN activo' });
            }
        }
        // Check if trying to remove super admin role from last active super admin
        if (role && role !== 'SUPER_ADMIN' && adminToUpdate.role === 'SUPER_ADMIN' && adminToUpdate.active) {
            const activeSuperAdmins = await prisma_1.prisma.platformAdmin.count({
                where: { role: 'SUPER_ADMIN', active: true }
            });
            if (activeSuperAdmins <= 1) {
                return reply.code(400).send({ error: 'No puedes quitar el rol SUPER_ADMIN al último activo' });
            }
        }
        const updated = await prisma_1.prisma.platformAdmin.update({
            where: { id },
            data: { role, active },
            select: { id: true, email: true, name: true, role: true, active: true }
        });
        return reply.send(updated);
    }
    static async deleteAdmin(request, reply) {
        const { id } = request.params;
        const admin = await prisma_1.prisma.platformAdmin.findUnique({ where: { id } });
        if (!admin)
            return reply.code(404).send({ error: 'Admin no encontrado' });
        if (admin.role === 'SUPER_ADMIN' && admin.active) {
            const activeSuperAdmins = await prisma_1.prisma.platformAdmin.count({
                where: { role: 'SUPER_ADMIN', active: true }
            });
            if (activeSuperAdmins <= 1) {
                return reply.code(400).send({ error: 'No puedes eliminar al último SUPER_ADMIN activo' });
            }
        }
        await prisma_1.prisma.platformAdmin.update({
            where: { id },
            data: { active: false } // Soft delete
        });
        return reply.send({ success: true, message: 'Administrador desactivado correctamente' });
    }
}
exports.PlatformAdminsController = PlatformAdminsController;
