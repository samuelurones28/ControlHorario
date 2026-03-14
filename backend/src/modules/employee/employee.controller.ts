import { FastifyReply, FastifyRequest } from 'fastify';
import { EmployeeService } from './employee.service';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.schemas';

const employeeService = new EmployeeService();

export class EmployeeController {
  async listEmployees(request: FastifyRequest, reply: FastifyReply) {
    const companyId = request.tenant!.companyId;
    const employees = await employeeService.listEmployees(companyId);
    return reply.send(employees);
  }

  async createEmployee(request: FastifyRequest, reply: FastifyReply) {
    const companyId = request.tenant!.companyId;
    const data = createEmployeeSchema.parse(request.body);
    
    try {
      const result = await employeeService.createEmployee(companyId, data);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message || 'Error creating employee' });
    }
  }

  async updateEmployee(request: FastifyRequest, reply: FastifyReply) {
    const companyId = request.tenant!.companyId;
    const { id } = request.params as { id: string };
    const data = updateEmployeeSchema.parse(request.body);

    try {
      const result = await employeeService.updateEmployee(id, companyId, data);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message || 'Error updating employee' });
    }
  }

  async deleteEmployee(request: FastifyRequest, reply: FastifyReply) {
    const companyId = request.tenant!.companyId;
    const { id } = request.params as { id: string };

    try {
      const result = await employeeService.deleteEmployee(id, companyId);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(400).send({ message: error.message || 'Error deleting employee' });
    }
  }
}
