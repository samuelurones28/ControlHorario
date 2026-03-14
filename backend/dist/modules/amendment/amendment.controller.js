"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmendmentController = void 0;
const amendment_service_1 = require("./amendment.service");
const amendment_schemas_1 = require("./amendment.schemas");
const amendmentService = new amendment_service_1.AmendmentService();
class AmendmentController {
    async createAmendment(request, reply) {
        const data = amendment_schemas_1.createAmendmentSchema.parse(request.body);
        const adminId = request.tenant.userId;
        const companyId = request.tenant.companyId;
        try {
            const amendment = await amendmentService.createAmendment(adminId, companyId, data);
            return reply.status(201).send(amendment);
        }
        catch (error) {
            return reply.status(400).send({ message: error.message || 'Error processing request' });
        }
    }
    async getAdminAmendments(request, reply) {
        const companyId = request.tenant.companyId;
        const amendments = await amendmentService.getAdminAmendments(companyId);
        return reply.send(amendments);
    }
}
exports.AmendmentController = AmendmentController;
