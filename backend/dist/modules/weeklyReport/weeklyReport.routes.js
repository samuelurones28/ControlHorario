"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyReportRoutes = weeklyReportRoutes;
const weeklyReport_controller_1 = require("./weeklyReport.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const auditLogger_1 = require("../../middleware/auditLogger");
async function weeklyReportRoutes(app) {
    const weeklyReportController = new weeklyReport_controller_1.WeeklyReportController();
    app.addHook('preValidation', authenticate_1.authenticate);
    app.addHook('onResponse', auditLogger_1.auditLogger);
    // Employee endpoints
    app.get('/me/pending', weeklyReportController.getMyPendingReports.bind(weeklyReportController));
    app.get('/me', weeklyReportController.getMyReports.bind(weeklyReportController));
    app.post('/:id/accept', weeklyReportController.acceptReport.bind(weeklyReportController));
    app.post('/:id/dispute', weeklyReportController.disputeReport.bind(weeklyReportController));
    // Admin endpoints
    app.register(async (adminApp) => {
        adminApp.addHook('preValidation', (0, authorize_1.authorize)(['ADMIN']));
        adminApp.get('/all', weeklyReportController.getAllReports.bind(weeklyReportController));
        adminApp.get('/disputed', weeklyReportController.getDisputedReports.bind(weeklyReportController));
    });
}
