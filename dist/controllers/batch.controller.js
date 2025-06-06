"use strict";
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
exports.deleteBatch = exports.updateBatch = exports.getBatchById = exports.getMyBatches = exports.createBatch = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const apiResponse_1 = require("../utils/apiResponse");
const client_2 = require("@prisma/client");
// (Ensure your express.d.ts or local declaration for Request.user is set up)
/**
 * Creates a new batch under a specific tank.
 * Ownership is verified by ensuring the tank belongs to the logged-in farmer.
 * Only farmers should be able to create batches for their tanks.
 */
const createBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Correctly extract user from req.user
    const currentUser = req.user;
    if (!currentUser) {
        return (0, apiResponse_1.apiResponse)(res, 401, 'Unauthorized: User not authenticated.');
    }
    const { tankId, batchCode, coffeeVariety, weightKg, startDate, endDate, isActive } = req.body;
    const parsedWeightKg = parseFloat(weightKg);
    if (isNaN(parsedWeightKg)) {
        return (0, apiResponse_1.apiResponse)(res, 400, 'Invalid input for weightKg. Must be a number.');
    }
    try {
        // Check tank ownership: Only the farmer who owns the tank can create a batch for it.
        // Admins can create for any tank.
        let isAuthorized = false;
        if (currentUser.role === client_2.Role.ADMIN) {
            isAuthorized = true; // Admin can create for any tank
        }
        else if (currentUser.role === client_2.Role.FARMER) {
            const tank = yield client_1.default.tank.findFirst({
                where: {
                    id: tankId,
                    farm: { farmerId: currentUser.id }, // Check ownership for farmer
                },
            });
            isAuthorized = !!tank; // True if tank is found and owned by the farmer
        }
        else {
            return (0, apiResponse_1.apiResponse)(res, 403, 'Forbidden: Only farmers and admins can create batches.');
        }
        if (!isAuthorized) {
            return (0, apiResponse_1.apiResponse)(res, 403, 'Forbidden: You do not have permission to create a batch for this tank.');
        }
        const batch = yield client_1.default.batch.create({
            data: {
                tankId,
                batchCode,
                coffeeVariety,
                weightKg: parsedWeightKg,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });
        return (0, apiResponse_1.apiResponse)(res, 201, 'Batch created successfully', batch);
    }
    catch (error) {
        console.error('Error creating batch:', error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to create batch. Please try again.');
    }
});
exports.createBatch = createBatch;
/**
 * Retrieves batches based on user role:
 * - Farmers see only batches associated with their owned tanks.
 * - Undugu employees and Admins see all batches in the system.
 */
const getMyBatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUser = req.user;
    if (!currentUser) {
        return (0, apiResponse_1.apiResponse)(res, 401, 'Unauthorized: User not authenticated.');
    }
    let whereClause = {};
    // Apply filtering based on user role
    if (currentUser.role === client_2.Role.FARMER) {
        whereClause = {
            tank: {
                farm: {
                    farmerId: currentUser.id, // Filter by the farmer's ID
                },
            },
        };
    }
    // If currentUser.role is ADMIN or UNDUGU, whereClause remains empty,
    // which will return all batches as desired.
    try {
        const batches = yield client_1.default.batch.findMany({
            where: whereClause,
            include: {
                tank: {
                    include: {
                        farm: true, // Include the associated farm for display on frontend
                    },
                },
            },
            orderBy: {
                createdAt: 'desc', // Order by creation date (optional, but good practice)
            },
        });
        return (0, apiResponse_1.apiResponse)(res, 200, 'Batches fetched successfully', batches);
    }
    catch (error) {
        console.error('Error fetching batches:', error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to retrieve batches. Please try again later.');
    }
});
exports.getMyBatches = getMyBatches;
/**
 * Retrieves a single batch by ID.
 * - Farmers can only access their own batches.
 * - Undugu employees and Admins can access any batch.
 */
const getBatchById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const batchId = req.params.id;
    const currentUser = req.user;
    if (!currentUser) {
        return (0, apiResponse_1.apiResponse)(res, 401, 'Unauthorized: User not authenticated.');
    }
    let batchWhereClause = { id: batchId };
    // Apply ownership check only for farmers
    if (currentUser.role === client_2.Role.FARMER) {
        batchWhereClause = {
            id: batchId,
            tank: { farm: { farmerId: currentUser.id } }, // Farmer must own the tank associated with the batch
        };
    }
    try {
        const batch = yield client_1.default.batch.findFirst({
            where: batchWhereClause,
            include: {
                tank: {
                    include: {
                        farm: true, // Include farm data
                    },
                },
            },
        });
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found or you do not have permission to access it.' });
        }
        return (0, apiResponse_1.apiResponse)(res, 200, 'Batch fetched successfully', batch);
    }
    catch (error) {
        console.error(`Error fetching batch ${batchId}:`, error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to retrieve batch. Please try again.');
    }
});
exports.getBatchById = getBatchById;
/**
 * Updates an existing batch.
 * Only the farmer who owns the batch (via tank/farm) or an Admin/Undugu can update it.
 */
const updateBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const batchId = req.params.id;
    const { batchCode, coffeeVariety, weightKg, startDate, endDate, isActive } = req.body;
    const currentUser = req.user;
    if (!currentUser) {
        return (0, apiResponse_1.apiResponse)(res, 401, 'Unauthorized: User not authenticated.');
    }
    let parsedWeightKg;
    if (weightKg !== undefined) {
        parsedWeightKg = parseFloat(weightKg);
        if (isNaN(parsedWeightKg)) {
            return (0, apiResponse_1.apiResponse)(res, 400, 'Invalid input for weightKg. Must be a number.');
        }
    }
    let updateWhereClause = { id: batchId };
    // Only apply ownership check for farmers
    if (currentUser.role === client_2.Role.FARMER) {
        updateWhereClause = {
            id: batchId,
            tank: { farm: { farmerId: currentUser.id } }, // Farmer must own the associated tank
        };
    }
    try {
        const updated = yield client_1.default.batch.updateMany({
            where: updateWhereClause,
            data: {
                batchCode,
                coffeeVariety,
                weightKg: parsedWeightKg,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                isActive,
            },
        });
        if (updated.count === 0) {
            return res.status(404).json({ message: 'Batch not found or you do not have permission to update it.' });
        }
        return (0, apiResponse_1.apiResponse)(res, 200, 'Batch updated successfully');
    }
    catch (error) {
        console.error(`Error updating batch ${batchId}:`, error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to update batch. Please try again.');
    }
});
exports.updateBatch = updateBatch;
/**
 * Deletes a batch.
 * Only the farmer who owns the batch (via tank/farm) or an Admin/Undugu can delete it.
 */
const deleteBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const batchId = req.params.id;
    const currentUser = req.user;
    if (!currentUser) {
        return (0, apiResponse_1.apiResponse)(res, 401, 'Unauthorized: User not authenticated.');
    }
    let deleteWhereClause = { id: batchId };
    // Only apply ownership check for farmers
    if (currentUser.role === client_2.Role.FARMER) {
        deleteWhereClause = {
            id: batchId,
            tank: { farm: { farmerId: currentUser.id } }, // Farmer must own the associated tank
        };
    }
    try {
        const deleted = yield client_1.default.batch.deleteMany({
            where: deleteWhereClause,
        });
        if (deleted.count === 0) {
            return res.status(404).json({ message: 'Batch not found or you do not have permission to delete it.' });
        }
        return (0, apiResponse_1.apiResponse)(res, 200, 'Batch deleted successfully');
    }
    catch (error) {
        console.error(`Error deleting batch ${batchId}:`, error);
        return (0, apiResponse_1.apiResponse)(res, 500, 'Failed to delete batch. Please try again.');
    }
});
exports.deleteBatch = deleteBatch;
