"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyRoutes = void 0;
const authorize_1 = require("../../middleware/authorize");
const privacy_controller_1 = require("./privacy.controller");
const privacyRoutes = async (app) => {
    app.get('/me', {
        preHandler: [(0, authorize_1.authorize)(['EMPLOYEE', 'ADMIN'])]
    }, privacy_controller_1.checkPrivacyConsent);
    app.post('/accept', {
        preHandler: [(0, authorize_1.authorize)(['EMPLOYEE', 'ADMIN'])]
    }, privacy_controller_1.acceptPrivacyConsent);
};
exports.privacyRoutes = privacyRoutes;
