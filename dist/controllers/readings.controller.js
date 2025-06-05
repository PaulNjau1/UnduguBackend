"use strict";
// src/controllers/readingsController.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpindelReadingById = exports.getSpindelReadingsByBatchId = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const apiResponse_1 = require("../utils/apiResponse");
const client_2 = require("@prisma/client");
// Assuming Role enum is accessible
/**
 * Get all Spindel readings for a specific batch.
 * This controller includes authorization checks to ensure users can only access readings
 * for batches they are permitted to view (e.g., farmers for their own farm's tanks).
 */
const getSpindelReadingsByBatchId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { batchId } = req.params;
    const user = req.user; // Authenticated user from middleware
    try {
        // First, find the batch to ensure it exists and to get its associated tank/farm
        const batch = yield client_1.default.batch.findUnique({
            where: { id: batchId },
            include: {
                tank: {
                    include: {
                        farm: true,
                    },
                },
            },
        });
        if (!batch) {
            return (0, apiResponse_1.apiResponse)(res, 404, 'Batch not found.');
        }
        // Authorization check: Farmers can only see readings for batches in their assigned tanks.
        // Admins and other roles (if defined) can see all.
        if (user.role === client_2.Role.FARMER) {
            const isFarmerAssociated = yield client_1.default.farm.findFirst({
                where: {
                    id: batch.tank.farmId,
                    farmerId: user.id,
                },
            });
            if (!isFarmerAssociated) {
                return (0, apiResponse_1.apiResponse)(res, 403, 'You do not have permission to view readings for this batch.');
            }
        }
        // Fetch Spindel readings for the batch
        const readings = yield client_1.default.spindelReading.findMany({
            where: { batchId },
            orderBy: {
                createdAt: 'asc', // Order by creation date for charting purposes
            },
            // You can select specific fields if you don't need all of them to reduce payload size
            // select: {
            //   id: true,
            //   createdAt: true,
            //   gravity: true,
            //   temperature: true,
            //   angleTilt: true,
            //   battery: true,
            //   rssi: true,
            //   unit: true,
            // }
        });
        return (0, apiResponse_1.apiResponse)(res, 200, 'Spindel readings retrieved successfully', readings);
    }
    catch (error) {
        console.error('Error getting Spindel readings:', error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to retrieve Spindel readings.', error.message);
    }
});
exports.getSpindelReadingsByBatchId = getSpindelReadingsByBatchId;
/**
 * Get a single Spindel reading by ID.
 * This is less common for charts but useful for debugging or specific data points.
 */
const getSpindelReadingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { batchId } = req.params;
    const user = req.user;
    try {
        const reading = yield client_1.default.spindelReading.findUnique({
            where: { id: batchId },
            include: {
                batch: {
                    include: {
                        tank: {
                            include: {
                                farm: true,
                            },
                        },
                    },
                },
            },
        });
        if (!reading) {
            return (0, apiResponse_1.apiResponse)(res, 404, 'Spindel reading not found.');
        }
        // Authorization check (similar to getSpindelReadingsByBatchId)
        if (user.role === client_2.Role.FARMER) {
            const isFarmerAssociated = yield client_1.default.farm.findFirst({
                where: {
                    id: reading.batch.tank.farmId,
                    farmerId: user.id,
                },
            });
            if (!isFarmerAssociated) {
                return (0, apiResponse_1.apiResponse)(res, 403, 'You do not have permission to view this Spindel reading.');
            }
        }
        return (0, apiResponse_1.apiResponse)(res, 200, 'Spindel reading retrieved successfully', reading);
    }
    catch (error) {
        console.error('Error getting single Spindel reading:', error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to retrieve Spindel reading.', error.message);
    }
});
exports.getSpindelReadingById = getSpindelReadingById;
