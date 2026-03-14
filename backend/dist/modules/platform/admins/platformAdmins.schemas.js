"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminSchema = exports.createAdminSchema = void 0;
const zod_1 = require("zod");
exports.createAdminSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(2),
    role: zod_1.z.enum(['SUPER_ADMIN', 'SUPPORT', 'VIEWER']),
    password: zod_1.z.string().min(8)
});
exports.updateAdminSchema = zod_1.z.object({
    role: zod_1.z.enum(['SUPER_ADMIN', 'SUPPORT', 'VIEWER']).optional(),
    active: zod_1.z.boolean().optional()
});
