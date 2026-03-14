"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = reportRoutes;
const report_controller_1 = require("./report.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const auditLogger_1 = require("../../middleware/auditLogger");
async function reportRoutes(app) {
    const reportController = new report_controller_1.ReportController();
    app.addHook('preValidation', authenticate_1.authenticate);
    app.addHook('preValidation', (0, authorize_1.authorize)(['ADMIN']));
    app.addHook('onResponse', auditLogger_1.auditLogger);
    app.get('/daily', reportController.getDailyReport.bind(reportController));
    app.get('/export', reportController.exportCsv.bind(reportController));
}
