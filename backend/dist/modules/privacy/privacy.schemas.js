"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyConsentSchema = void 0;
const zod_1 = require("zod");
exports.privacyConsentSchema = zod_1.z.object({
    version: zod_1.z.string().min(1),
    ipAddress: zod_1.z.string().optional()
});
