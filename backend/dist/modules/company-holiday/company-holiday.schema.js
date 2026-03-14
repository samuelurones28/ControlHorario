"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHolidaysDto = exports.createHolidayDto = void 0;
const zod_1 = require("zod");
exports.createHolidayDto = zod_1.z.object({
    date: zod_1.z.string().datetime(),
    name: zod_1.z.string()
});
// array of dates to allow batch creation
exports.createHolidaysDto = zod_1.z.array(exports.createHolidayDto);
