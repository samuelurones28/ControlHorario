"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("./auth.controller");
const auditLogger_1 = require("../../middleware/auditLogger");
async function authRoutes(app) {
    const authController = new auth_controller_1.AuthController();
    app.addHook('onResponse', auditLogger_1.auditLogger);
    app.post('/register-company', authController.registerCompany.bind(authController));
    app.post('/login/admin', authController.adminLogin.bind(authController));
    app.post('/login/employee', authController.employeeLogin.bind(authController));
    app.post('/refresh', authController.refresh.bind(authController));
    app.post('/logout', authController.logout.bind(authController));
}
