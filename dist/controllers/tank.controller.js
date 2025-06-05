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
exports.deleteTank = exports.updateTank = exports.getTankById = exports.getTanksByFarmId = exports.getMyTanks = exports.createTank = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const apiResponse_1 = require("../utils/apiResponse");
// Assuming req.user is populated by your authentication middleware
// and has at least 'id' and 'role' properties.
// Example: interface AuthRequest extends Request { user: { id: string; role: string; }; }
// Create tank under a farm (ownership enforced)
const createTank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { farmId, name, spindelApiUrl } = req.body;
    const userId = req.user.id; // Assuming req.user is populated by auth middleware
    // Validate ownership of farm for the farmer role
    const farm = yield client_1.default.farm.findFirst({
        where: { id: farmId, farmerId: userId },
    });
    // Only farmers can create tanks for their own farms.
    // Admins and Undugu roles might have different permissions,
    // but based on existing code, creating is farmer-specific.
    if (!farm) {
        return (0, apiResponse_1.apiResponse)(res, 403, 'Not authorized to create a tank for this farm.');
    }
    const tank = yield client_1.default.tank.create({
        data: { name, farmId, spindelApiUrl },
    });
    return (0, apiResponse_1.apiResponse)(res, 201, 'Tank created successfully', tank);
});
exports.createTank = createTank;
// Get all tanks for current user (from all farms they own)
const getMyTanks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const tanks = yield client_1.default.tank.findMany({
        where: {
            farm: { farmerId: userId },
        },
        include: {
            farm: true,
        },
    });
    return (0, apiResponse_1.apiResponse)(res, 200, 'Tanks fetched successfully', tanks);
});
exports.getMyTanks = getMyTanks;
/**
 * @desc Get all tanks for a specific farm ID.
 * @route GET /api/v1/farms/:farmId/tanks
 * @access Private (Auth: Farmer can see their farm's tanks, Admin/Undugu can see any farm's tanks)
 */
const getTanksByFarmId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { farmId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role; // Assuming role is available on req.user
    if (!farmId) {
        return (0, apiResponse_1.apiResponse)(res, 400, 'Farm ID is required.');
    }
    // Find the farm to check ownership/existence
    const farm = yield client_1.default.farm.findUnique({
        where: { id: farmId },
        select: { farmerId: true }, // Select only farmerId for efficiency
    });
    if (!farm) {
        return (0, apiResponse_1.apiResponse)(res, 404, `Farm with ID ${farmId} not found.`);
    }
    // Fetch tanks associated with the farmId
    const tanks = yield client_1.default.tank.findMany({
        where: {
            farmId: farmId,
        },
        // Include any related data you might need, e.g., batches
        include: {
            batches: true, // Example: include batches if needed for display
        },
    });
    return (0, apiResponse_1.apiResponse)(res, 200, 'Tanks fetched successfully for farm', tanks);
});
exports.getTanksByFarmId = getTanksByFarmId;
// Get single tank by ID (ownership enforced for farmers, admin/undugu can access any)
const getTankById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    // Find the tank first to check ownership/existence
    const tank = yield client_1.default.tank.findUnique({
        where: { id },
        include: {
            farm: {
                select: { farmerId: true }, // Select farmerId from the associated farm
            },
            batches: true,
        },
    });
    if (!tank) {
        return (0, apiResponse_1.apiResponse)(res, 404, 'Tank not found.');
    }
    // Authorization Logic for single tank:
    // - Admin and UNDUGU roles can view any tank.
    // - FARMER role can only view tanks belonging to their own farms.
    const isAuthorized = userRole === 'ADMIN' ||
        userRole === 'UNDUGU' ||
        (userRole === 'FARMER' && ((_a = tank.farm) === null || _a === void 0 ? void 0 : _a.farmerId) === userId);
    if (!isAuthorized) {
        return (0, apiResponse_1.apiResponse)(res, 403, 'Not authorized to view this tank.');
    }
    return (0, apiResponse_1.apiResponse)(res, 200, 'Tank fetched successfully', tank);
});
exports.getTankById = getTankById;
// Update tank (ownership enforced for farmers, admin/undugu can update any)
const updateTank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, spindelApiUrl } = req.body; // Allow updating spindelApiUrl too
    const userId = req.user.id;
    const userRole = req.user.role;
    // Find the tank first to check ownership/existence for authorization
    const existingTank = yield client_1.default.tank.findUnique({
        where: { id },
        select: {
            farm: {
                select: { farmerId: true },
            },
        },
    });
    if (!existingTank) {
        return (0, apiResponse_1.apiResponse)(res, 404, 'Tank not found.');
    }
    const updatedTank = yield client_1.default.tank.update({
        where: { id },
        data: { name, spindelApiUrl }, // Pass updated data
    });
    return (0, apiResponse_1.apiResponse)(res, 200, 'Tank updated successfully', updatedTank);
});
exports.updateTank = updateTank;
// Delete tank (ownership enforced for farmers, admin/undugu can delete any)
const deleteTank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Find the tank first to check ownership/existence for authorization
    const existingTank = yield client_1.default.tank.findUnique({
        where: { id },
    });
    if (!existingTank) {
        return (0, apiResponse_1.apiResponse)(res, 404, 'Tank not found.');
    }
    yield client_1.default.tank.delete({
        where: { id },
    });
    return (0, apiResponse_1.apiResponse)(res, 200, 'Tank deleted successfully');
});
exports.deleteTank = deleteTank;
