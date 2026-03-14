"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAmendmentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createAmendmentSchema = zod_1.z.object({
    incidentId: zod_1.z.string().uuid().optional(),
    originalEntryId: zod_1.z.string().uuid().optional(),
    employeeId: zod_1.z.string().uuid(),
    action: zod_1.z.nativeEnum(client_1.AmendmentAction),
    newTimestamp: zod_1.z.string().datetime(),
    entryType: zod_1.z.nativeEnum(client_1.EntryType),
    reason: zod_1.z.string().min(5)
});
