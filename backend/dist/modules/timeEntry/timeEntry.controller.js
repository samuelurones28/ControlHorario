"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeEntryController = void 0;
const timeEntry_service_1 = require("./timeEntry.service");
const timeEntry_schemas_1 = require("./timeEntry.schemas");
const timeEntryService = new timeEntry_service_1.TimeEntryService();
class TimeEntryController {
    async clock(request, reply) {
        const data = timeEntry_schemas_1.clockSchema.parse(request.body);
        const employeeId = request.tenant?.employeeId;
        if (!employeeId) {
            return reply.status(401).send({ message: 'Unauthorized: No employee ID' });
        }
        const ipAddress = request.ip;
        const deviceInfo = request.headers['user-agent'];
        try {
            const entry = await timeEntryService.clock(employeeId, data, ipAddress, deviceInfo);
            return reply.status(201).send(entry);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message || 'Error processing clock action' });
        }
    }
    async getMyHistory(request, reply) {
        const query = timeEntry_schemas_1.historyQuerySchema.parse(request.query || {});
        const employeeId = request.tenant?.employeeId;
        if (!employeeId) {
            return reply.status(401).send({ message: 'Unauthorized: No employee ID' });
        }
        const history = await timeEntryService.getMyHistory(employeeId, query.from, query.to);
        return reply.send(history);
    }
    async getAllHistory(request, reply) {
        const query = request.query;
        const companyId = request.tenant?.companyId;
        if (!companyId) {
            return reply.status(401).send({ message: 'Unauthorized: No company ID' });
        }
        const history = await timeEntryService.getAllHistory(companyId, query.employeeId, query.from, query.to);
        return reply.send(history);
    }
}
exports.TimeEntryController = TimeEntryController;
