"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBatchSchema = exports.createBatchSchema = void 0;
const zod_1 = require("zod");
exports.createBatchSchema = zod_1.z.object({
    tankId: zod_1.z.string().uuid(),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateBatchSchema = zod_1.z.object({
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }).optional(),
    notes: zod_1.z.string().optional(),
});
