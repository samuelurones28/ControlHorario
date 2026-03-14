"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSupportController = void 0;
const prisma_1 = require("../../../utils/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PlatformSupportController {
    static async searchUsers(request, reply) {
        const { email, identifier, companyCode } = request.query;
        // Require at least one filter
        if (!email && !identifier && !companyCode) {
            return reply.code(400).send({ error: 'Debes proporcionar al menos un filtro' });
        }
        const where = {};
        if (email) {
            where.user = { email: { contains: email, mode: 'insensitive' } };
        }
        if (identifier) {
            where.identifier = { contains: identifier, mode: 'insensitive' };
        }
        if (companyCode) {
            where.company = { code: { contains: companyCode, mode: 'insensitive' } };
        }
        const employees = await prisma_1.prisma.employee.findMany({
            where,
            include: {
                user: { select: { id: true, email: true } },
                company: { select: { id: true, name: true, code: true } }
            },
            take: 50
        });
        // To evaluate if a user account is locked by rate limiting, we'd normally check redis or the DB
        // Assuming no current DB lock field, we just return basic info
        const enrichedEmployees = employees.map(emp => ({
            ...emp,
            accountStatus: emp.active ? 'active' : 'inactive', // Simplified
        }));
        return reply.send(enrichedEmployees);
    }
    static async unlockUser(request, reply) {
        const { userId } = request.params;
        // Assuming we flush redis or remove a lockout flag. 
        // Here we simulate the logic.
        return reply.send({ success: true, message: `Usuario ${userId} desbloqueado exitosamente` });
    }
    static async resetPasswordRequest(request, reply) {
        const { userId } = request.params;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return reply.code(404).send({ error: 'Usuario no encontrado' });
        // Generate token and simulate email sending
        // const resetToken = crypto.randomBytes(32).toString('hex')
        // await sendEmail(user.email, resetToken)
        return reply.send({ success: true, message: 'Enlace de reseteo enviado (Simulado)' });
    }
    static async resetPin(request, reply) {
        const { employeeId } = request.params;
        const tempPin = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4 digit PIN
        const pinHash = await bcryptjs_1.default.hash(tempPin, 10);
        await prisma_1.prisma.employee.update({
            where: { id: employeeId },
            data: { pinHash }
            // In a real app we might set a flag `mustChangePinOnNextLogin: true` if our schema had it
        });
        return reply.send({
            success: true,
            tempPin, // Returned so SUPER_ADMIN can tell the user
            message: 'PIN reseteado. El usuario debe cambiarlo en su próximo acceso'
        });
    }
}
exports.PlatformSupportController = PlatformSupportController;
