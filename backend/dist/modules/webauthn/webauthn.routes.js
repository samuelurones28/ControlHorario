"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webauthnRoutes = webauthnRoutes;
const webauthn_controller_1 = require("./webauthn.controller");
const authenticate_1 = require("../../middleware/authenticate");
async function webauthnRoutes(app) {
    // Public endpoints (no auth required)
    app.post('/webauthn/authenticate/options', (req, reply) => webauthn_controller_1.webAuthnController.authenticateOptions(req, reply));
    app.post('/webauthn/authenticate/verify', (req, reply) => webauthn_controller_1.webAuthnController.authenticateVerify(req, reply));
    // Protected endpoints (auth required)
    app.post('/webauthn/register/options', { preHandler: authenticate_1.authenticate }, (req, reply) => webauthn_controller_1.webAuthnController.registerOptions(req, reply));
    app.post('/webauthn/register/verify', { preHandler: authenticate_1.authenticate }, (req, reply) => webauthn_controller_1.webAuthnController.registerVerify(req, reply));
    app.get('/webauthn/credentials', { preHandler: authenticate_1.authenticate }, (req, reply) => webauthn_controller_1.webAuthnController.listCredentials(req, reply));
    app.delete('/webauthn/credentials/:credentialId', { preHandler: authenticate_1.authenticate }, (req, reply) => webauthn_controller_1.webAuthnController.deleteCredential(req, reply));
}
