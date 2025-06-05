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
exports.deleteFarm = exports.updateFarm = exports.getFarmById = exports.getFarms = exports.createFarm = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const apiResponse_1 = require("../utils/apiResponse");
function isAdminOrUndugu(user) {
    return user.role === "admin" || user.role === "undugu";
}
// Create a new farm
const createFarm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, location, latitude, longitude, farmerId } = req.body;
    {
        const farm = yield client_1.default.farm.create({
            data: {
                name,
                location,
                farmerId,
                latitude,
                longitude,
            },
        });
        return (0, apiResponse_1.apiResponse)(res, 201, "Farm created", farm);
    }
});
exports.createFarm = createFarm;
// Get all farms (admin/undugu see all, farmers see their own)
const getFarms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const user = req.user;
    const whereClause = isAdminOrUndugu(user) ? {} : { farmerId: user.id };
    const farms = yield client_1.default.farm.findMany({ where: whereClause });
    return (0, apiResponse_1.apiResponse)(res, 200, "Farms fetched", farms);
});
exports.getFarms = getFarms;
// Get a specific farm by ID with role-based access
const getFarmById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // @ts-ignore
    const user = req.user;
    const farm = yield client_1.default.farm.findUnique({
        where: { id },
    });
    if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
    }
    return (0, apiResponse_1.apiResponse)(res, 200, "Farm fetched", farm);
});
exports.getFarmById = getFarmById;
// Update a farm with role-based access
const updateFarm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, location } = req.body;
    // @ts-ignore
    const user = req.user;
    const farm = yield client_1.default.farm.findUnique({ where: { id } });
    if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
    }
    const updatedFarm = yield client_1.default.farm.update({
        where: { id },
        data: { name, location },
    });
    return (0, apiResponse_1.apiResponse)(res, 200, "Farm updated", updatedFarm);
});
exports.updateFarm = updateFarm;
// Delete a farm with role-based access
const deleteFarm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // @ts-ignore
    const user = req.user;
    const farm = yield client_1.default.farm.findUnique({ where: { id } });
    if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
    }
    yield client_1.default.farm.delete({ where: { id } });
    return (0, apiResponse_1.apiResponse)(res, 200, "Farm deleted");
});
exports.deleteFarm = deleteFarm;
