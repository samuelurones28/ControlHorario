"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptPrivacyConsent = exports.checkPrivacyConsent = void 0;
const prisma_1 = require("../../utils/prisma");
const checkPrivacyConsent = async (req, reply) => {
    const user = req.user;
    const employeeId = user.employeeId;
    // Find the latest consent signed by this employee
    const consent = await prisma_1.prisma.privacyConsent.findFirst({
        where: { employeeId },
        orderBy: { acceptedAt: 'desc' }
    });
    return reply.send({
        hasConsent: !!consent,
        latestVersion: consent?.version || null,
        acceptedAt: consent?.acceptedAt || null
    });
};
exports.checkPrivacyConsent = checkPrivacyConsent;
const acceptPrivacyConsent = async (req, reply) => {
    const user = req.user;
    const employeeId = user.employeeId;
    const { version, ipAddress } = req.body;
    const clientIp = ipAddress || req.ip || '0.0.0.0';
    const consent = await prisma_1.prisma.privacyConsent.create({
        data: {
            employeeId,
            version,
            ipAddress: clientIp,
        }
    });
    return reply.send(consent);
};
exports.acceptPrivacyConsent = acceptPrivacyConsent;
