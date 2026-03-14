"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentRoutes = incidentRoutes;
const incident_controller_1 = require("./incident.controller");
const authenticate_1 = require("../../middleware/authenticate");
const authorize_1 = require("../../middleware/authorize");
const auditLogger_1 = require("../../middleware/auditLogger");
async function incidentRoutes(app) {
    const incidentController = new incident_controller_1.IncidentController();
    app.addHook('preValidation', authenticate_1.authenticate);
    app.addHook('onResponse', auditLogger_1.auditLogger);
    app.post('/', incidentController.createIncident.bind(incidentController));
    app.get('/me', incidentController.getMyIncidents.bind(incidentController));
    // Admin endpoints
    app.register(async (adminApp) => {
        adminApp.addHook('preValidation', (0, authorize_1.authorize)(['ADMIN']));
        adminApp.get('/all', incidentController.getAllIncidents.bind(incidentController));
    });
}
