import { FastifyRequest, FastifyReply } from 'fastify';
import { webAuthnService } from './webauthn.service';

export class WebAuthnController {
  // Registration: Step 1 - Get challenge
  async registerOptions(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant?.employeeId;

    if (!employeeId) {
      return reply.status(401).send({ message: 'Not authenticated' });
    }

    try {
      const options = await webAuthnService.generateRegistrationChallenge(employeeId);
      return reply.send(options);
    } catch (error) {
      const e = error as Error;
      return reply.status(400).send({ message: e.message });
    }
  }

  // Registration: Step 2 - Store credential
  async registerVerify(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant?.employeeId;

    if (!employeeId) {
      return reply.status(401).send({ message: 'Not authenticated' });
    }

    const { credentialId, publicKey, name } = request.body as {
      credentialId: string;
      publicKey: string;
      name?: string;
    };

    if (!credentialId || !publicKey) {
      return reply.status(400).send({ message: 'Missing credentialId or publicKey' });
    }

    try {
      const savedCred = await webAuthnService.registerCredential(
        employeeId,
        credentialId,
        publicKey,
        name
      );
      return reply.send({
        success: true,
        credentialId: savedCred.id,
        message: 'Biometric registered successfully'
      });
    } catch (error) {
      const e = error as Error;
      return reply.status(400).send({ message: e.message });
    }
  }

  // Authentication: Step 1 - Get challenge
  async authenticateOptions(request: FastifyRequest, reply: FastifyReply) {
    const { companyCode, identifier } = request.body as { companyCode: string; identifier: string };

    if (!companyCode || !identifier) {
      return reply.status(400).send({ message: 'Missing company code or identifier' });
    }

    try {
      const options = await webAuthnService.generateAuthenticationChallenge(
        companyCode,
        identifier
      );

      return reply.send(options);
    } catch (error) {
      const e = error as Error;
      return reply.status(400).send({ message: e.message });
    }
  }

  // Authentication: Step 2 - Verify and return JWT
  async authenticateVerify(request: FastifyRequest, reply: FastifyReply) {
    const { credentialId, employeeId } = request.body as {
      credentialId: string;
      employeeId: string;
    };

    if (!credentialId || !employeeId) {
      return reply.status(400).send({ message: 'Missing credentialId or employeeId' });
    }

    try {
      const employee = await webAuthnService.verifyAuthentication(
        employeeId,
        credentialId
      );

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
    } catch (error) {
      const e = error as Error;
      return reply.status(401).send({ message: e.message });
    }
  }

  // List registered credentials
  async listCredentials(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant?.employeeId;

    if (!employeeId) {
      return reply.status(401).send({ message: 'Not authenticated' });
    }

    try {
      const credentials = await webAuthnService.listCredentials(employeeId);
      return reply.send({ credentials });
    } catch (error) {
      const e = error as Error;
      return reply.status(400).send({ message: e.message });
    }
  }

  // Delete a credential
  async deleteCredential(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant?.employeeId;
    const { credentialId } = request.params as { credentialId: string };

    if (!employeeId) {
      return reply.status(401).send({ message: 'Not authenticated' });
    }

    if (!credentialId) {
      return reply.status(400).send({ message: 'Missing credentialId' });
    }

    try {
      await webAuthnService.deleteCredential(employeeId, credentialId);
      return reply.send({ success: true, message: 'Credential deleted' });
    } catch (error) {
      const e = error as Error;
      return reply.status(400).send({ message: e.message });
    }
  }
}

export const webAuthnController = new WebAuthnController();
