"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRoutes = void 0;
const authorize_1 = require("../../middleware/authorize");
const schedule_controller_1 = require("./schedule.controller");
const scheduleRoutes = async (app) => {
    app.get('/me', {
        preHandler: [(0, authorize_1.authorize)(['EMPLOYEE', 'ADMIN'])]
    }, schedule_controller_1.getMySchedule);
    app.get('/company', {
        preHandler: [(0, authorize_1.authorize)(['ADMIN'])]
    }, schedule_controller_1.getCompanySchedules);
    app.put('/', {
        preHandler: [(0, authorize_1.authorize)(['ADMIN'])]
    }, schedule_controller_1.updateSchedules);
};
exports.scheduleRoutes = scheduleRoutes;
