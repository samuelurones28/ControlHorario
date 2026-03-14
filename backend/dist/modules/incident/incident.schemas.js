"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIncidentSchema = void 0;
const zod_1 = require("zod");
exports.createIncidentSchema = zod_1.z.object({
    timeEntryId: zod_1.z.string().uuid().optional(),
    date: zod_1.z.string().datetime(),
    description: zod_1.z.string().min(5)
});
