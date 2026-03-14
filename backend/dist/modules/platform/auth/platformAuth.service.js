"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAuthService = void 0;
/**
 * Platform Authentication Service
 * Handles platform login, token generation and 2FA
 */
class PlatformAuthService {
    app;
    constructor(app) {
        this.app = app;
    }
    /**
     * Primary logic inside auth service for login
     */
    async login(email, passwordHash) {
        // Left empty for direct logic in controller to utilize fastify reply nicely
    }
    /**
     * Generates isolated platform tokens
     */
    generateTokens(platformAdmin) {
        const payload = {
            id: platformAdmin.id,
            email: platformAdmin.email,
            role: platformAdmin.role,
            scope: 'platform' // Critical isolation point
        };
        const accessToken = this.app.jwt.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.app.jwt.sign(payload, { expiresIn: '2h' });
        return { accessToken, refreshToken };
    }
}
exports.PlatformAuthService = PlatformAuthService;
