"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbsenceController = void 0;
const absence_service_1 = require("./absence.service");
const absence_schema_1 = require("./absence.schema");
class AbsenceController {
    absenceService;
    constructor() {
        this.absenceService = new absence_service_1.AbsenceService();
    }
    async createRequest(request, reply) {
        const data = absence_schema_1.createAbsenceDto.parse(request.body);
        const result = await this.absenceService.createRequest(request.tenant.employeeId, request.tenant.companyId, data);
        return reply.status(201).send(result);
    }
    async createAdminRequest(request, reply) {
        const data = absence_schema_1.adminCreateAbsenceDto.parse(request.body);
        const result = await this.absenceService.createAdminRequest(request.tenant.companyId, data, request.tenant.employeeId);
        return reply.status(201).send(result);
    }
    async getMyRequests(request, reply) {
        const result = await this.absenceService.getMyRequests(request.tenant.employeeId);
        return reply.send(result);
    }
    async getCompanyRequests(request, reply) {
        const result = await this.absenceService.getCompanyRequests(request.tenant.companyId);
        return reply.send(result);
    }
    async updateStatus(request, reply) {
        const { id } = request.params;
        const data = absence_schema_1.updateAbsenceStatusDto.parse(request.body);
        const result = await this.absenceService.updateStatus(id, data, request.tenant.employeeId, request.tenant.companyId);
        return reply.send(result);
    }
    async cancelRequest(request, reply) {
        const { id } = request.params;
        const result = await this.absenceService.cancelRequest(id, request.tenant.employeeId);
        return reply.send(result);
    }
}
exports.AbsenceController = AbsenceController;
