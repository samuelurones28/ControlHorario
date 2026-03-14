"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRecoverySchema = exports.setupTotpSchema = exports.verifyTotpSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
exports.verifyTotpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    totpCode: zod_1.z.string().length(6)
});
exports.setupTotpSchema = zod_1.z.object({
    totpCode: zod_1.z.string().length(6)
});
exports.verifyRecoverySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    recoveryCode: zod_1.z.string().min(8).max(9)
});
