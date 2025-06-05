"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertSchema = exports.createAlertSchema = void 0;
const zod_1 = require("zod");
exports.createAlertSchema = zod_1.z.object({
    batchId: zod_1.z.string().uuid(),
    readingId: zod_1.z.string().uuid(), // ✅ Required for valid Prisma insert
    message: zod_1.z.string().min(1),
    level: zod_1.z.enum(['INFO', 'WARNING', 'CRITICAL']),
});
exports.updateAlertSchema = exports.createAlertSchema.partial();
