"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeRoutes = employeeRoutes;
const employee_controller_1 = require("./employee.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const auditLogger_1 = require("../../middleware/auditLogger");
async function employeeRoutes(app) {
    const employeeController = new employee_controller_1.EmployeeController();
    app.addHook('preValidation', authenticate_1.authenticate);
    app.addHook('preValidation', (0, authorize_1.authorize)(['ADMIN']));
    app.addHook('onResponse', auditLogger_1.auditLogger);
    app.get('/', employeeController.listEmployees.bind(employeeController));
    app.post('/', employeeController.createEmployee.bind(employeeController));
    app.patch('/:id', employeeController.updateEmployee.bind(employeeController));
    app.delete('/:id', employeeController.deleteEmployee.bind(employeeController));
}
