"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionSchema = void 0;
const zod_1 = require("zod");
exports.createSessionSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    refreshToken: zod_1.z.string(),
    userAgent: zod_1.z.string().optional(),
});
