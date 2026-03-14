"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPinRequestSchema = exports.resetPasswordRequestSchema = exports.userSearchQuerySchema = void 0;
const zod_1 = require("zod");
exports.userSearchQuerySchema = zod_1.z.object({
    email: zod_1.z.string().optional(),
    identifier: zod_1.z.string().optional(),
    companyCode: zod_1.z.string().optional()
});
exports.resetPasswordRequestSchema = zod_1.z.object({}); // empty body typical for just triggering action
exports.resetPinRequestSchema = zod_1.z.object({}); // empty body typical
