"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webAuthnController = exports.WebAuthnController = void 0;
const webauthn_service_1 = require("./webauthn.service");
class WebAuthnController {
    // Registration: Step 1 - Get challenge
    async registerOptions(request, reply) {
        const employeeId = request.tenant?.employeeId;
        if (!employeeId) {
            return reply.status(401).send({ message: 'Not authenticated' });
        }
        try {
            const options = await webauthn_service_1.webAuthnService.generateRegistrationChallenge(employeeId);
            return reply.send(options);
        }
        catch (error) {
            const e = error;
            return reply.status(400).send({ message: e.message });
        }
    }
    // Registration: Step 2 - Store credential
    async registerVerify(request, reply) {
        const employeeId = request.tenant?.employeeId;
        if (!employeeId) {
            return reply.status(401).send({ message: 'Not authenticated' });
        }
        const { credentialId, publicKey, name } = request.body;
        if (!credentialId || !publicKey) {
            return reply.status(400).send({ message: 'Missing credentialId or publicKey' });
        }
        try {
            const savedCred = await webauthn_service_1.webAuthnService.registerCredential(employeeId, credentialId, publicKey, name);
            return reply.send({
                success: true,
                credentialId: savedCred.id,
                message: 'Biometric registered successfully'
            });
        }
        catch (error) {
            const e = error;
            return reply.status(400).send({ message: e.message });
        }
    }
    // Authentication: Step 1 - Get challenge
    async authenticateOptions(request, reply) {
        const { companyCode, identifier } = request.body;
        if (!companyCode || !identifier) {
            return reply.status(400).send({ message: 'Missing company code or identifier' });
        }
        try {
            const options = await webauthn_service_1.webAuthnService.generateAuthenticationChallenge(companyCode, identifier);
            return reply.send(options);
        }
        catch (error) {
            const e = error;
            return reply.status(400).send({ message: e.message });
        }
    }
    // Authentication: Step 2 - Verify and return JWT
    async authenticateVerify(request, reply) {
        const { credentialId, employeeId } = request.body;
        if (!credentialId || !employeeId) {
            return reply.status(400).send({ message: 'Missing credentialId or employeeId' });
        }
        try {
            const employee = await webauthn_service_1.webAuthnService.verifyAuthentication(employeeId, credentialId);
            // Generate JWT token
            const tokenPayload = {
                id: employee.id,
                userId: employee.userId,
                role: employee.role,
                companyId: employee.companyId,
            };
            const accessToken = await reply.jwtSign(tokenPayload, { expiresIn: '15m' });
            const refreshToken = request.server.jwt.sign(tokenPayload, {
                expiresIn: '24h',
                key: process.env.JWT_REFRESH_SECRET
            });
            reply.setCookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
            return reply.send({
                accessToken,
                employee: {
                    id: employee.id,
                    name: employee.name,
                    role: employee.role,
                    companyId: employee.companyId,
                    identifier: employee.identifier
                }
            });
        }
        catch (error) {
            const e = error;
            return reply.status(401).send({ message: e.message });
        }
    }
    // List registered credentials
    async listCredentials(request, reply) {
        const employeeId = request.tenant?.employeeId;
        if (!employeeId) {
            return reply.status(401).send({ message: 'Not authenticated' });
        }
        try {
            const credentials = await webauthn_service_1.webAuthnService.listCredentials(employeeId);
            return reply.send({ credentials });
        }
        catch (error) {
            const e = error;
            return reply.status(400).send({ message: e.message });
        }
    }
    // Delete a credential
    async deleteCredential(request, reply) {
        const employeeId = request.tenant?.employeeId;
        const { credentialId } = request.params;
        if (!employeeId) {
            return reply.status(401).send({ message: 'Not authenticated' });
        }
        if (!credentialId) {
            return reply.status(400).send({ message: 'Missing credentialId' });
        }
        try {
            await webauthn_service_1.webAuthnService.deleteCredential(employeeId, credentialId);
            return reply.send({ success: true, message: 'Credential deleted' });
        }
        catch (error) {
            const e = error;
            return reply.status(400).send({ message: e.message });
        }
    }
}
exports.WebAuthnController = WebAuthnController;
exports.webAuthnController = new WebAuthnController();
