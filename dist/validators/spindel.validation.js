"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpindelReadingSchema = void 0;
const zod_1 = require("zod");
exports.createSpindelReadingSchema = zod_1.z.object({
    batchId: zod_1.z.string().uuid(),
    temperature: zod_1.z.number(),
    angleTilt: zod_1.z.number(),
    battery: zod_1.z.number(),
    gravity: zod_1.z.number(),
    interval: zod_1.z.number(),
    rssi: zod_1.z.number(),
    unit: zod_1.z.string(),
    ssid: zod_1.z.string().optional(),
});
