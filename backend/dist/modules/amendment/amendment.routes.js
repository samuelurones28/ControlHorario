"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amendmentRoutes = amendmentRoutes;
const amendment_controller_1 = require("./amendment.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const auditLogger_1 = require("../../middleware/auditLogger");
async function amendmentRoutes(app) {
    const amendmentController = new amendment_controller_1.AmendmentController();
    app.addHook('preValidation', authenticate_1.authenticate);
    app.addHook('onResponse', auditLogger_1.auditLogger);
    app.post('/', amendmentController.createAmendment.bind(amendmentController));
    app.register(async (adminApp) => {
        adminApp.addHook('preValidation', (0, authorize_1.authorize)(['ADMIN']));
        adminApp.get('/', amendmentController.getAdminAmendments.bind(amendmentController));
    });
}
