"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonitoringMetricsQuerySchema = exports.getMonitoringErrorsQuerySchema = void 0;
const zod_1 = require("zod");
exports.getMonitoringErrorsQuerySchema = zod_1.z.object({
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
    severity: zod_1.z.string().optional()
});
exports.getMonitoringMetricsQuerySchema = zod_1.z.object({
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional()
});
