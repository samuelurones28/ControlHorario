"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyHolidayRoutes = companyHolidayRoutes;
const company_holiday_controller_1 = require("./company-holiday.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const auditLogger_1 = require("../../middleware/auditLogger");
async function companyHolidayRoutes(app) {
    const controller = new company_holiday_controller_1.CompanyHolidayController();
    app.addHook('preValidation', authenticate_1.authenticate);
    app.addHook('onResponse', auditLogger_1.auditLogger);
    app.get('/', controller.listCompanyHolidays.bind(controller));
    // Endpoints Administrador
    app.register(async (adminRoutes) => {
        adminRoutes.addHook('preValidation', (0, authorize_1.authorize)(['ADMIN']));
        adminRoutes.post('/', controller.setCompanyHolidays.bind(controller));
        adminRoutes.delete('/:id', controller.deleteHoliday.bind(controller));
    });
}
