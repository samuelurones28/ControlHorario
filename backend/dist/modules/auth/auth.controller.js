"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_schemas_1 = require("./auth.schemas");
const env_1 = require("../../config/env");
const authService = new auth_service_1.AuthService();
class AuthController {
    async registerCompany(request, reply) {
        const data = auth_schemas_1.registerCompanySchema.parse(request.body);
        const result = await authService.registerCompany(data);
        return reply.status(201).send({
            message: 'Company and admin created successfully',
            companyCode: result.company.code,
            companyId: result.company.id,
            adminId: result.admin.id
        });
    }
    async adminLogin(request, reply) {
        const data = auth_schemas_1.adminLoginSchema.parse(request.body);
        const { user, activeEmployee } = await authService.adminLogin(data);
        const tokenPayload = {
            id: activeEmployee.id,
            userId: user.id,
            role: activeEmployee.role,
            companyId: activeEmployee.companyId,
        };
        const accessToken = await reply.jwtSign(tokenPayload, { expiresIn: '15m' });
        const refreshToken = request.server.jwt.sign(tokenPayload, {
            expiresIn: '7d',
            key: env_1.config.JWT_REFRESH_SECRET
        });
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env_1.config.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        return reply.send({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
            },
            employee: {
                id: activeEmployee.id,
                name: activeEmployee.name,
                role: activeEmployee.role,
            }
        });
    }
    async employeeLogin(request, reply) {
        const data = auth_schemas_1.employeeLoginSchema.parse(request.body);
        const employee = await authService.employeeLogin(data);
        const tokenPayload = {
            id: employee.id,
            userId: employee.userId,
            role: employee.role,
            companyId: employee.companyId,
        };
        const accessToken = await reply.jwtSign(tokenPayload, { expiresIn: '15m' });
        const refreshToken = request.server.jwt.sign(tokenPayload, {
            expiresIn: '7d',
            key: env_1.config.JWT_REFRESH_SECRET
        });
        reply.setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: env_1.config.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        return reply.send({
            accessToken,
            employee: {
                id: employee.id,
                name: employee.name,
                identifier: employee.identifier,
                role: employee.role,
                company: employee.company.name
            }
        });
    }
    async refresh(request, reply) {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            return reply.status(401).send({ message: 'No refresh token provided' });
        }
        try {
            const decoded = request.server.jwt.verify(refreshToken, {
                key: env_1.config.JWT_REFRESH_SECRET
            });
            const tokenPayload = {
                id: decoded.id,
                userId: decoded.userId,
                role: decoded.role,
                companyId: decoded.companyId,
            };
            const accessToken = await reply.jwtSign(tokenPayload, { expiresIn: '15m' });
            return reply.send({ accessToken });
        }
        catch (err) {
            return reply.status(401).send({ message: 'Invalid or expired refresh token' });
        }
    }
    async logout(request, reply) {
        reply.clearCookie('refreshToken', { path: '/' });
        return reply.send({ message: 'Logged out successfully' });
    }
}
exports.AuthController = AuthController;
