"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAbsenceStatusDto = exports.adminCreateAbsenceDto = exports.createAbsenceDto = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createAbsenceDto = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.AbsenceType),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime(),
    notes: zod_1.z.string().optional(),
});
exports.adminCreateAbsenceDto = exports.createAbsenceDto.extend({
    employeeId: zod_1.z.string().uuid(),
    status: zod_1.z.nativeEnum(client_1.AbsenceStatus).optional(),
});
exports.updateAbsenceStatusDto = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.AbsenceStatus),
    reviewNote: zod_1.z.string().optional(),
});
