"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protocolRoutes = void 0;
const authorize_1 = require("../../middleware/authorize");
const protocol_controller_1 = require("./protocol.controller");
const protocolRoutes = async (app) => {
    // Only admins can download the official protocol
    app.get('/download', {
        preHandler: [(0, authorize_1.authorize)(['ADMIN'])]
    }, protocol_controller_1.downloadProtocol);
};
exports.protocolRoutes = protocolRoutes;
