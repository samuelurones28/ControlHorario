"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webAuthnService = exports.WebAuthnService = void 0;
const prisma_1 = require("../../utils/prisma");
const crypto_1 = __importDefault(require("crypto"));
class WebAuthnService {
    // Simplified WebAuthn without external library
    // Uses Web Authentication API on client, stores basics on server
    /**
     * Generate a challenge for registration
     * Client will use this with navigator.credentials.create()
     */
    async generateRegistrationChallenge(employeeId) {
        const employee = await prisma_1.prisma.employee.findUnique({
            where: { id: employeeId }
        });
        if (!employee) {
            throw new Error('Employee not found');
        }
        // Generate a random challenge
        const challenge = crypto_1.default.randomBytes(32).toString('base64');
        return {
            challenge,
            rp: {
                name: 'Control Horario',
                id: 'localhost', // Will be set by client based on domain
            },
            user: {
                id: Buffer.from(employeeId).toString('base64'),
                name: employee.identifier,
                displayName: employee.name,
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' }, // ES256
                { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
            },
            timeout: 60000,
            attestation: 'none',
        };
    }
    /**
     * Store registered credential
     */
    async registerCredential(employeeId, credentialId, publicKey, name) {
        const employee = await prisma_1.prisma.employee.findUnique({
            where: { id: employeeId }
        });
        if (!employee) {
            throw new Error('Employee not found');
        }
        // Check if already registered
        const existing = await prisma_1.prisma.webAuthnCredential.findUnique({
            where: { credentialId }
        });
        if (existing) {
            throw new Error('Credential already registered');
        }
        const savedCredential = await prisma_1.prisma.webAuthnCredential.create({
            data: {
                employeeId,
                credentialId,
                publicKey, // Stored as base64
                counter: 0,
                name: name || `Biometría ${new Date().toLocaleDateString('es-ES')}`,
                transports: [],
            },
        });
        return savedCredential;
    }
    /**
     * Generate challenge for authentication
     */
    async generateAuthenticationChallenge(companyCode, identifier) {
        const company = await prisma_1.prisma.company.findUnique({
            where: { code: companyCode }
        });
        if (!company) {
            throw new Error('Company not found');
        }
        const employee = await prisma_1.prisma.employee.findUnique({
            where: {
                identifier_companyId: {
                    identifier,
                    companyId: company.id
                }
            }
        });
        if (!employee) {
            throw new Error('Employee not found');
        }
        // Get all registered credentials for this employee
        const credentials = await prisma_1.prisma.webAuthnCredential.findMany({
            where: { employeeId: employee.id }
        });
        if (credentials.length === 0) {
            throw new Error('No biometric credentials registered');
        }
        // Generate a random challenge
        const challenge = crypto_1.default.randomBytes(32).toString('base64');
        return {
            challenge,
            allowCredentials: credentials.map(cred => ({
                id: cred.credentialId,
                type: 'public-key',
                transports: ['internal'], // Platform authenticator
            })),
            userVerification: 'required',
            timeout: 60000,
            employeeId: employee.id,
        };
    }
    /**
     * Verify authentication (simplified - just check credential exists)
     * In production, you'd verify the signature with the public key
     */
    async verifyAuthentication(employeeId, credentialId) {
        const employee = await prisma_1.prisma.employee.findUnique({
            where: { id: employeeId }
        });
        if (!employee) {
            throw new Error('Employee not found');
        }
        // Verify credential belongs to employee
        const credential = await prisma_1.prisma.webAuthnCredential.findFirst({
            where: {
                employeeId,
                credentialId,
            },
        });
        if (!credential) {
            throw new Error('Credential not found or unauthorized');
        }
        // Update last used
        await prisma_1.prisma.webAuthnCredential.update({
            where: { id: credential.id },
            data: { lastUsedAt: new Date() },
        });
        return employee;
    }
    async listCredentials(employeeId) {
        return await prisma_1.prisma.webAuthnCredential.findMany({
            where: { employeeId },
            select: {
                id: true,
                name: true,
                createdAt: true,
                lastUsedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteCredential(employeeId, credentialId) {
        const credential = await prisma_1.prisma.webAuthnCredential.findUnique({
            where: { id: credentialId }
        });
        if (!credential || credential.employeeId !== employeeId) {
            throw new Error('Credential not found or unauthorized');
        }
        await prisma_1.prisma.webAuthnCredential.delete({
            where: { id: credentialId }
        });
        return { success: true };
    }
}
exports.WebAuthnService = WebAuthnService;
exports.webAuthnService = new WebAuthnService();
