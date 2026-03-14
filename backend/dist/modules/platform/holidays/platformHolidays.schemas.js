"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHolidaySchema = exports.createHolidaySchema = exports.getHolidaysQuerySchema = void 0;
const zod_1 = require("zod");
exports.getHolidaysQuerySchema = zod_1.z.object({
    year: zod_1.z.string().transform(Number).optional(),
    region: zod_1.z.string().optional()
});
exports.createHolidaySchema = zod_1.z.object({
    date: zod_1.z.string().datetime(),
    name: zod_1.z.string().min(2),
    region: zod_1.z.string().default('ES')
});
exports.updateHolidaySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    region: zod_1.z.string().optional()
});
