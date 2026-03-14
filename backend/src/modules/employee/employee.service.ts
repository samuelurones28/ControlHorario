import { prisma } from '../../utils/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export class EmployeeService {
  async listEmployees(companyId: string) {
    return await prisma.employee.findMany({
      where: { companyId },
      select: {
        id: true, name: true, identifier: true, role: true, 
        contractType: true, weeklyHours: true, active: true, createdAt: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async createEmployee(companyId: string, data: any) {
    const email = data.email && data.email.trim() !== '' ? data.email : null;
    
    // Auto-create or find existing global User identity
    const user = email
      ? await prisma.user.upsert({
          where: { email },
          create: { email },
          update: {} // do nothing if it already exists
        })
      : await prisma.user.create({ data: {} });

    // In employee normal login takes PIN randomly generated and 6 digits long.
    const pin = crypto.randomInt(100000, 999999).toString();
    const pinHash = await bcrypt.hash(pin, 12);

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        companyId,
        name: data.name,
        identifier: data.identifier,
        role: data.role,
        contractType: data.contractType,
        weeklyHours: data.weeklyHours,
        pinHash
      }
    });

    return { ...employee, plainPin: pin };
  }

  async updateEmployee(employeeId: string, companyId: string, data: any) {
    const existing = await prisma.employee.findFirst({
      where: { id: employeeId, companyId }
    });

    if (!existing) throw new Error('Employee not found or unauthorized');

    return await prisma.employee.update({
      where: { id: employeeId },
      data,
      select: { id: true, name: true, identifier: true, role: true, active: true }
    });
  }

  async deleteEmployee(employeeId: string, companyId: string) {
    const existing = await prisma.employee.findFirst({
      where: { id: employeeId, companyId }
    });

    if (!existing) throw new Error('Employee not found or unauthorized');

    return await prisma.employee.update({
      where: { id: employeeId },
      data: { active: false },
      select: { id: true, name: true, active: true }
    });
  }
}
