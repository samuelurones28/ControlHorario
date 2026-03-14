"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAuthController = void 0;
const prisma_1 = require("../../../utils/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const totp_service_1 = require("./totp.service");
/**
 * Platform Authentication Controller
 */
class PlatformAuthController {
    static async login(request, reply) {
        const { email, password } = request.body;
        const admin = await prisma_1.prisma.platformAdmin.findUnique({ where: { email } });
        if (!admin || !admin.active) {
            // Return ambiguous error to prevent email enumeration
            return reply.code(401).send({ error: 'Credenciales inválidas' });
        }
        const isValid = await bcryptjs_1.default.compare(password, admin.passwordHash);
        if (!isValid) {
            return reply.code(401).send({ error: 'Credenciales inválidas' });
        }
        // Check if 2FA is set up
        if (!admin.totpSecret) {
            if (admin.role === 'SUPER_ADMIN') {
                const setupInfo = await totp_service_1.TotpService.generateSecret(admin.email);
                // Temporarily store the secret in the admin record (NOT active yet)
                // We use a prefix or temporary storage. Here we'll just return it so frontend can display
                // Security-wise, it's safe to return the secret only during setup.
                return reply.code(200).send({
                    requiresTOTP: true,
                    needsSetup: true,
                    setupInfo: {
                        secret: setupInfo.secret,
                        qrCodeUrl: setupInfo.qrCodeUrl
                    }
                });
            }
            else {
                // Non-super admins might skip 2FA for now
                return PlatformAuthController.generateAndSendTokens(request, reply, admin);
            }
        }
        // 2FA is set up, require code
        return reply.code(200).send({ requiresTOTP: true, needsSetup: false });
    }
    static async verifyTotp(request, reply) {
        const { email, totpCode } = request.body;
        const admin = await prisma_1.prisma.platformAdmin.findUnique({ where: { email } });
        if (!admin || !admin.active || !admin.totpSecret) {
            return reply.code(401).send({ error: 'Credenciales inválidas o 2FA no configurado' });
        }
        // Verify TOTP
        const isValidTotp = totp_service_1.TotpService.verify(admin.totpSecret, totpCode);
        if (!isValidTotp) {
            // Check if it's a backup code
            const backupCode = await prisma_1.prisma.platformBackupCode.findFirst({
                where: { platformAdminId: admin.id, usedAt: null }
            });
            // Highly simplified backup code check - in real prod we would iterate and compare hash
            // For this implementation, we will assume strict TOTP for now
            return reply.code(401).send({ error: 'Código TOTP inválido' });
        }
        // Success
        await prisma_1.prisma.platformAdmin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() }
        });
        return PlatformAuthController.generateAndSendTokens(request, reply, admin);
    }
    static async setupTotp(request, reply) {
        const { email, totpCode, secret } = request.body;
        const admin = await prisma_1.prisma.platformAdmin.findUnique({ where: { email } });
        if (!admin || !admin.active)
            return reply.code(401).send({ error: 'Unauthorized' });
        const isValid = totp_service_1.TotpService.verify(secret, totpCode);
        if (!isValid) {
            return reply.code(400).send({ error: 'El código TOTP es inválido' });
        }
        // Valid setup. Generate backup codes
        const plainCodes = totp_service_1.TotpService.generateBackupCodes();
        // Hash codes and save
        const hashedCodes = await Promise.all(plainCodes.map(code => bcryptjs_1.default.hash(code, 10)));
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.platformAdmin.update({
                where: { id: admin.id },
                data: { totpSecret: secret }
            }),
            prisma_1.prisma.platformBackupCode.createMany({
                data: hashedCodes.map(hash => ({
                    platformAdminId: admin.id,
                    codeHash: hash
                }))
            })
        ]);
        return PlatformAuthController.generateAndSendTokens(request, reply, admin, plainCodes);
    }
    static async refresh(request, reply) {
        const refreshToken = request.cookies.rt_platform;
        if (!refreshToken) {
            return reply.code(401).send({ error: 'No refresh token' });
        }
        try {
            const decoded = request.server.jwt.verify(refreshToken);
            if (decoded.scope !== 'platform') {
                throw new Error('Invalid token scope');
            }
            const accessToken = request.server.jwt.sign({
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                scope: 'platform'
            }, { expiresIn: '15m' });
            return reply.send({ accessToken });
        }
        catch (err) {
            reply.clearCookie('rt_platform', { path: '/api/v1/platform/auth' });
            return reply.code(401).send({ error: 'Invalid refresh token' });
        }
    }
    static async logout(request, reply) {
        reply.clearCookie('rt_platform', { path: '/api/v1/platform/auth' });
        return reply.send({ success: true });
    }
    // --- Helpers ---
    static generateAndSendTokens(request, reply, admin, backupCodes) {
        const payload = {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            scope: 'platform'
        };
        const accessToken = request.server.jwt.sign(payload, { expiresIn: '15m' });
        const refreshToken = request.server.jwt.sign(payload, { expiresIn: '2h' });
        // Set isolated cookie
        reply.setCookie('rt_platform', refreshToken, {
            path: '/api/v1/platform/auth',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7200 // 2 hours
        });
        const responseFormat = {
            accessToken,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            }
        };
        if (backupCodes)
            responseFormat.backupCodes = backupCodes;
        return reply.send(responseFormat);
    }
}
exports.PlatformAuthController = PlatformAuthController;
