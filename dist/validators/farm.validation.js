"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFarmSchema = exports.createFarmSchema = void 0;
const zod_1 = require("zod");
exports.createFarmSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    location: zod_1.z.string().min(1),
    latitude: zod_1.z.coerce.number().optional(),
    longitude: zod_1.z.coerce.number().optional(),
    farmerId: zod_1.z.string().uuid(),
});
exports.updateFarmSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).optional(),
    location: zod_1.z.string().min(1).optional(),
    latitude: zod_1.z.coerce.number().optional(),
    longitude: zod_1.z.coerce.number().optional(),
})
    .refine((data) => data.name || data.location || data.latitude || data.longitude, {
    message: 'At least one field must be provided for update.',
});
