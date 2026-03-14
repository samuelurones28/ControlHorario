import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { adminLoginSchema, employeeLoginSchema, registerCompanySchema } from './auth.schemas';
import { config } from '../../config/env';

const authService = new AuthService();

export class AuthController {
  async registerCompany(request: FastifyRequest, reply: FastifyReply) {
    const data = registerCompanySchema.parse(request.body);
    const result = await authService.registerCompany(data);
    return reply.status(201).send({
      message: 'Company and admin created successfully',
      companyCode: result.company.code,
      companyId: result.company.id,
      adminId: result.admin.id
    });
  }

  async adminLogin(request: FastifyRequest, reply: FastifyReply) {
    const data = adminLoginSchema.parse(request.body);
    const { user, activeEmployee } = await authService.adminLogin(data);

    const tokenPayload = {
      id: activeEmployee.id,
      userId: user.id,
      role: activeEmployee.role,
      companyId: activeEmployee.companyId,
    };

    const accessToken = await reply.jwtSign(tokenPayload, { expiresIn: '15m' });
    const refreshToken = request.server.jwt.sign(tokenPayload, {
      expiresIn: '24h',
      key: config.JWT_REFRESH_SECRET
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
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

  async employeeLogin(request: FastifyRequest, reply: FastifyReply) {
    const data = employeeLoginSchema.parse(request.body);
    const employee = await authService.employeeLogin(data);

    const tokenPayload = {
      id: employee.id,
      userId: employee.userId,
      role: employee.role,
      companyId: employee.companyId,
    };

    const accessToken = await reply.jwtSign(tokenPayload, { expiresIn: '15m' });
    const refreshToken = request.server.jwt.sign(tokenPayload, {
      expiresIn: '24h',
      key: config.JWT_REFRESH_SECRET
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
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

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      return reply.status(401).send({ message: 'No refresh token provided' });
    }

    try {
      const decoded = request.server.jwt.verify(refreshToken, {
        key: config.JWT_REFRESH_SECRET
      }) as any;

      const tokenPayload = {
        id: decoded.id,
        userId: decoded.userId,
        role: decoded.role,
        companyId: decoded.companyId,
      };

      const accessToken = await reply.jwtSign(tokenPayload, { expiresIn: '15m' });
      return reply.send({ accessToken });
    } catch (err) {
      return reply.status(401).send({ message: 'Invalid or expired refresh token' });
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('refreshToken', { path: '/' });
    return reply.send({ message: 'Logged out successfully' });
  }

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    const employeeId = request.tenant?.employeeId;
    if (!employeeId) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const employee = await authService.getEmployeeById(employeeId);
    if (!employee) {
      return reply.status(404).send({ message: 'Employee not found' });
    }

    return reply.send({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      companyId: employee.companyId,
      identifier: employee.identifier
    });
  }
}
