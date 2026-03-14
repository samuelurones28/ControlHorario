"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentController = void 0;
const incident_service_1 = require("./incident.service");
const incident_schemas_1 = require("./incident.schemas");
const incidentService = new incident_service_1.IncidentService();
class IncidentController {
    async createIncident(request, reply) {
        const data = incident_schemas_1.createIncidentSchema.parse(request.body);
        const employeeId = request.tenant.employeeId;
        try {
            const incident = await incidentService.createIncident(employeeId, data);
            return reply.status(201).send(incident);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message || 'Error processing request' });
        }
    }
    async getMyIncidents(request, reply) {
        const employeeId = request.tenant.employeeId;
        const incidents = await incidentService.getMyIncidents(employeeId);
        return reply.send(incidents);
    }
    async getAllIncidents(request, reply) {
        const companyId = request.tenant.companyId;
        const { status } = request.query;
        const incidents = await incidentService.getAllIncidents(companyId, status);
        return reply.send(incidents);
    }
}
exports.IncidentController = IncidentController;
