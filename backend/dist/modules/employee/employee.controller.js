"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const employee_service_1 = require("./employee.service");
const employee_schemas_1 = require("./employee.schemas");
const employeeService = new employee_service_1.EmployeeService();
class EmployeeController {
    async listEmployees(request, reply) {
        const companyId = request.tenant.companyId;
        const employees = await employeeService.listEmployees(companyId);
        return reply.send(employees);
    }
    async createEmployee(request, reply) {
        const companyId = request.tenant.companyId;
        const data = employee_schemas_1.createEmployeeSchema.parse(request.body);
        try {
            const result = await employeeService.createEmployee(companyId, data);
            return reply.status(201).send(result);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message || 'Error creating employee' });
        }
    }
    async updateEmployee(request, reply) {
        const companyId = request.tenant.companyId;
        const { id } = request.params;
        const data = employee_schemas_1.updateEmployeeSchema.parse(request.body);
        try {
            const result = await employeeService.updateEmployee(id, companyId, data);
            return reply.send(result);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message || 'Error updating employee' });
        }
    }
    async deleteEmployee(request, reply) {
        const companyId = request.tenant.companyId;
        const { id } = request.params;
        try {
            const result = await employeeService.deleteEmployee(id, companyId);
            return reply.send(result);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message || 'Error deleting employee' });
        }
    }
}
exports.EmployeeController = EmployeeController;
