"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeLoginSchema = exports.adminLoginSchema = exports.registerCompanySchema = void 0;
const zod_1 = require("zod");
exports.registerCompanySchema = zod_1.z.object({
    companyName: zod_1.z.string().min(2),
    cif: zod_1.z.string().min(8),
    address: zod_1.z.string().optional(),
    adminName: zod_1.z.string().min(2),
    adminEmail: zod_1.z.string().email(),
    adminPassword: zod_1.z.string().min(8)
});
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
exports.employeeLoginSchema = zod_1.z.object({
    companyCode: zod_1.z.string().min(1),
    identifier: zod_1.z.string().min(1),
    pin: zod_1.z.string().length(6)
});
