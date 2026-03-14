"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeEntryRoutes = timeEntryRoutes;
const timeEntry_controller_1 = require("./timeEntry.controller");
const authenticate_1 = require("../../middleware/authenticate");
const auditLogger_1 = require("../../middleware/auditLogger");
async function timeEntryRoutes(app) {
    const timeEntryController = new timeEntry_controller_1.TimeEntryController();
    // Protect all routes requiring authentication
    app.addHook('preValidation', authenticate_1.authenticate);
    // Audit logger for state mutations
    app.addHook('onResponse', auditLogger_1.auditLogger);
    app.post('/clock', timeEntryController.clock.bind(timeEntryController));
    app.get('/me', timeEntryController.getMyHistory.bind(timeEntryController));
    // Admin route for all history
    app.register(async (adminApp) => {
        // dynamically import authorize to avoid circular deps if any but here we just require it
        const { authorize } = require('../../middleware/authorize');
        adminApp.addHook('preValidation', authorize(['ADMIN']));
        adminApp.get('/all', timeEntryController.getAllHistory.bind(timeEntryController));
    });
}
