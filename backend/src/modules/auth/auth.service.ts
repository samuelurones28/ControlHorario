import bcrypt from 'bcrypt';
import { prisma } from '../../utils/prisma';
import { registerCompanySchema, adminLoginSchema, employeeLoginSchema } from './auth.schemas';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';

type RegisterCompanyDto = z.infer<typeof registerCompanySchema>;
type AdminLoginDto = z.infer<typeof adminLoginSchema>;
type EmployeeLoginDto = z.infer<typeof employeeLoginSchema>;

const generateCompanyCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

export class AuthService {
  async registerCompany(data: RegisterCompanyDto) {
    const existingCompany = await prisma.company.findUnique({
      where: { cif: data.cif }
    });

    if (existingCompany) {
      throw new Error('Company with this CIF already exists');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail }
    });

    if (existingUser) {
      throw new Error('Email is already in use by a User');
    }

    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);
    const companyCode = generateCompanyCode();

    return await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          code: companyCode,
          name: data.companyName,
          cif: data.cif,
          address: data.address
        }
      });

      const user = await tx.user.create({
        data: {
          email: data.adminEmail,
          passwordHash: hashedPassword
        }
      });

      const admin = await tx.employee.create({
        data: {
          userId: user.id,
          companyId: company.id,
          name: data.adminName,
          identifier: data.adminEmail, // Reusing email as unique identifier inside this company context
          role: 'ADMIN'
        }
      });

      return { company, user, admin };
    });
  }

  async adminLogin(data: AdminLoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { 
        employees: {
          include: { company: true }
        }
      }
    });

    if (!user || !data.password) {
      const err: any = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    if (!user.passwordHash) {
      const err: any = new Error('Admin login is not enabled for this user');
      err.statusCode = 401;
      throw err;
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      const err: any = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    // Defaulting to first company context for MVP
    if(user.employees.length === 0){
        throw new Error('No company assigned to this admin');
    }
    const adminProfile = user.employees.find(e => e.role === 'ADMIN') || user.employees[0];

    return { user, activeEmployee: adminProfile };
  }

  async employeeLogin(data: EmployeeLoginDto) {
    const company = await prisma.company.findUnique({
      where: { code: data.companyCode }
    });

    if (!company) {
      throw new Error('Company code not found');
    }

    const employee = await prisma.employee.findUnique({
      where: {
        identifier_companyId: {
          identifier: data.identifier,
          companyId: company.id
        }
      },
      include: { user: true, company: true }
    });

    if (!employee || !employee.active || !employee.pinHash) {
      throw new Error('Invalid credentials or inactive account');
    }

    const isValid = await bcrypt.compare(data.pin, employee.pinHash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return employee;
  }

  async getEmployeeById(employeeId: string) {
    return await prisma.employee.findUnique({
      where: { id: employeeId }
    });
  }
}

