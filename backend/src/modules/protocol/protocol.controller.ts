import { FastifyRequest, FastifyReply } from 'fastify';
import { ProtocolService } from './protocol.service';

const protocolService = new ProtocolService();

export const downloadProtocol = async (req: FastifyRequest, reply: FastifyReply) => {
  const user = req.user as any;
  const companyId = user.companyId;

  try {
    const pdfBuffer = await protocolService.generateInternalProtocol(companyId);
    
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'attachment; filename="Protocolo_Interno_Control_Horario.pdf"');
    
    return reply.send(pdfBuffer);
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ error: 'Failed to generate PDF protocol' });
  }
};
