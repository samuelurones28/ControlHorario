"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disputeReportSchema = void 0;
const zod_1 = require("zod");
exports.disputeReportSchema = zod_1.z.object({
    disputeReason: zod_1.z.string().min(5)
});
