"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyQuerySchema = exports.clockSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.clockSchema = zod_1.z.object({
    entryType: zod_1.z.nativeEnum(client_1.EntryType),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional()
});
exports.historyQuerySchema = zod_1.z.object({
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
});
