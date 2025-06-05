"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTankSchema = exports.createTankSchema = void 0;
const zod_1 = require("zod");
exports.createTankSchema = zod_1.z.object({
    farmId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    capacity: zod_1.z.number().int().positive().optional(),
    spindelApiUrl: zod_1.z.string().min(1).optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});
exports.updateTankSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    capacity: zod_1.z.number().int().positive().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});
