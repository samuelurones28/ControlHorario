"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    identifier: zod_1.z.string().min(2),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    role: zod_1.z.nativeEnum(client_1.Role).default(client_1.Role.EMPLOYEE),
    contractType: zod_1.z.string().optional(),
    weeklyHours: zod_1.z.number().optional()
});
exports.updateEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    identifier: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    role: zod_1.z.nativeEnum(client_1.Role).optional(),
    contractType: zod_1.z.string().optional(),
    weeklyHours: zod_1.z.number().optional(),
    active: zod_1.z.boolean().optional()
});
