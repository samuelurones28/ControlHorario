"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadProtocol = void 0;
const protocol_service_1 = require("./protocol.service");
const protocolService = new protocol_service_1.ProtocolService();
const downloadProtocol = async (req, reply) => {
    const user = req.user;
    const companyId = user.companyId;
    try {
        const pdfBuffer = await protocolService.generateInternalProtocol(companyId);
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', 'attachment; filename="Protocolo_Interno_Control_Horario.pdf"');
        return reply.send(pdfBuffer);
    }
    catch (error) {
        req.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate PDF protocol' });
    }
};
exports.downloadProtocol = downloadProtocol;
