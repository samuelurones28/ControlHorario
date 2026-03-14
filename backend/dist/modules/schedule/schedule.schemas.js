"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateScheduleSchema = exports.scheduleSchema = void 0;
const zod_1 = require("zod");
exports.scheduleSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().min(0).max(6),
    startTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    isWorkDay: zod_1.z.boolean(),
    employeeId: zod_1.z.string().uuid().nullable().optional() // if null/omitted, applies to company
});
exports.updateScheduleSchema = zod_1.z.object({
    schedules: zod_1.z.array(exports.scheduleSchema)
});
