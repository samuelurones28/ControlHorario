"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = auditRoutes;
const audit_controller_1 = require("./audit.controller");
const authenticate_1 = require("../../middleware/authenticate");
async function auditRoutes(app) {
    const auditController = new audit_controller_1.AuditController();
    app.get('/', {
        preHandler: authenticate_1.authenticate,
    }, auditController.getAuditLogs.bind(auditController));
}
