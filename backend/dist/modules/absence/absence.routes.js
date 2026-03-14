"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.absenceRoutes = absenceRoutes;
const absence_controller_1 = require("./absence.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const auditLogger_1 = require("../../middleware/auditLogger");
async function absenceRoutes(app) {
    const controller = new absence_controller_1.AbsenceController();
    app.addHook('preValidation', authenticate_1.authenticate);
    app.addHook('onResponse', auditLogger_1.auditLogger);
    // Endpoints Empleado
    app.post('/', controller.createRequest.bind(controller));
    app.get('/my', controller.getMyRequests.bind(controller));
    app.patch('/:id/cancel', controller.cancelRequest.bind(controller));
    // Endpoints Administrador
    app.register(async (adminRoutes) => {
        adminRoutes.addHook('preValidation', (0, authorize_1.authorize)(['ADMIN']));
        adminRoutes.post('/admin', controller.createAdminRequest.bind(controller));
        adminRoutes.get('/company', controller.getCompanyRequests.bind(controller));
        adminRoutes.patch('/:id/status', controller.updateStatus.bind(controller));
    });
}
