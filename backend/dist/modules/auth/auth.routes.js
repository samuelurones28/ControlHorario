"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("./auth.controller");
const auditLogger_1 = require("../../middleware/auditLogger");
const authenticate_1 = require("../../middleware/authenticate");
const loginRateLimiter_1 = require("../../middleware/loginRateLimiter");
async function authRoutes(app) {
    const authController = new auth_controller_1.AuthController();
    app.addHook('onResponse', auditLogger_1.auditLogger);
    app.post('/register-company', authController.registerCompany.bind(authController));
    app.post('/login/admin', { preHandler: loginRateLimiter_1.loginRateLimiter }, authController.adminLogin.bind(authController));
    app.post('/login/employee', { preHandler: loginRateLimiter_1.loginRateLimiter }, authController.employeeLogin.bind(authController));
    app.post('/refresh', authController.refresh.bind(authController));
    app.post('/logout', authController.logout.bind(authController));
    app.get('/me', { preHandler: authenticate_1.authenticate }, authController.getMe.bind(authController));
}
