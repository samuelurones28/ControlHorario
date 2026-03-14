"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyHolidayController = void 0;
const company_holiday_service_1 = require("./company-holiday.service");
const company_holiday_schema_1 = require("./company-holiday.schema");
class CompanyHolidayController {
    service;
    constructor() {
        this.service = new company_holiday_service_1.CompanyHolidayService();
    }
    async setCompanyHolidays(request, reply) {
        const data = company_holiday_schema_1.createHolidaysDto.parse(request.body);
        const result = await this.service.setCompanyHolidays(request.tenant.companyId, data);
        return reply.status(201).send(result);
    }
    async listCompanyHolidays(request, reply) {
        const result = await this.service.listCompanyHolidays(request.tenant.companyId);
        return reply.send(result);
    }
    async deleteHoliday(request, reply) {
        const { id } = request.params;
        await this.service.deleteHoliday(request.tenant.companyId, id);
        return reply.send({ success: true });
    }
}
exports.CompanyHolidayController = CompanyHolidayController;
